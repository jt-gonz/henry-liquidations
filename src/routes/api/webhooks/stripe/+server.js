import { json, text } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * POST /api/webhooks/stripe
 *
 * Listens for Stripe webhook events. On `checkout.session.completed`:
 * 1. Records the order in the Supabase `orders` table.
 * 2. Marks purchased products as out of stock.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return text('Missing stripe-signature header', { status: 400 });
	}

	// ── 1. Verify the webhook signature ─────────────────────────
	console.log(
		'[webhook] signature present, secret defined:',
		!!STRIPE_WEBHOOK_SECRET,
		'body length:',
		body.length
	);
	/** @type {Stripe.Event} */
	let event;
	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', /** @type {Error} */ (err).message);
		return text('Invalid signature', { status: 400 });
	}
	console.log('[webhook] verified event:', event.type);

	// ── 2. Handle the event ─────────────────────────────────────
	if (event.type === 'checkout.session.completed') {
		const session = /** @type {Stripe.Checkout.Session} */ (event.data.object);

		// Extract info
		const customerEmail = session.customer_details?.email ?? session.customer_email ?? 'unknown';
		const metadata = session.metadata ?? {};

		console.log('[webhook] session metadata:', JSON.stringify(metadata));

		/** @type {{ id: string, quantity: number }[]} */
		let cartItems = [];
		try {
			const raw = metadata.product_ids;
			if (raw && raw.length > 0) {
				cartItems = JSON.parse(raw);
			}
		} catch (e) {
			console.error('Failed to parse product_ids metadata:', e);
		}

		if (cartItems.length === 0) {
			console.warn('[webhook] No cart items found in metadata — falling back to Stripe line items');
			// Fallback: retrieve line items from Stripe directly
			try {
				const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
				cartItems = lineItems.data.map((li) => ({
					id: li.price?.product?.toString() ?? 'unknown',
					quantity: li.quantity ?? 1
				}));
			} catch (e) {
				console.error('[webhook] Failed to retrieve line items:', e);
			}
		}

		// Fetch product details for the order record
		const productIds = cartItems.map((i) => i.id);
		const { data: products } = await /** @type {any} */ (supabaseAdmin)
			.from('products')
			.select('id, name, price, stock_quantity, bundle_component_ids, in_stock')
			.in('id', productIds);

		const orderItems = cartItems.map((item) => {
			const product = products?.find(
				(/** @type {{ id: string, name: string, price: number }} */ p) => p.id === item.id
			);
			return {
				product_id: item.id,
				name: product?.name ?? 'Unknown product',
				price: Number(product?.price ?? 0),
				quantity: item.quantity
			};
		});

		console.log(
			'[webhook] inserting order with',
			orderItems.length,
			'items:',
			JSON.stringify(orderItems)
		);

		// ── 2a. Insert the order ────────────────────────────────
		const { error: orderError } = await supabaseAdmin.from('orders').insert(
			/** @type {any} */ ({
				stripe_session_id: session.id,
				customer_email: customerEmail,
				items: orderItems,
				payment_status: 'paid'
			})
		);

		if (orderError) {
			console.error('Failed to record order:', orderError.message);
		}

		// ── 2b. Decrement stock (bundle-aware) ──────────────────
		// A bundle (e.g. "King Bed-Dresser-Mirror") has no stock of its
		// own — buying one decrements each of its component pieces
		// instead, so a standalone "King Bed" listing and every bundle
		// that needs a king bed all stay correctly in sync automatically.
		/** @type {Map<string, number>} */
		const pieceDecrements = new Map();
		/** @type {string[]} */
		const legacyIds = [];

		for (const item of cartItems) {
			const product = products?.find((/** @type {any} */ p) => p.id === item.id);
			if (!product) continue;

			if (product.bundle_component_ids?.length > 0) {
				for (const componentId of product.bundle_component_ids) {
					pieceDecrements.set(componentId, (pieceDecrements.get(componentId) ?? 0) + item.quantity);
				}
			} else if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
				pieceDecrements.set(product.id, (pieceDecrements.get(product.id) ?? 0) + item.quantity);
			} else {
				// Legacy single-unit listing: no quantity tracked at all.
				legacyIds.push(product.id);
			}
		}

		for (const [pieceId, qty] of pieceDecrements) {
			const { error: decrementError } = await /** @type {any} */ (supabaseAdmin).rpc(
				'decrement_stock',
				{ p_product_id: pieceId, p_qty: qty }
			);
			if (decrementError) {
				console.error(`Failed to decrement stock for ${pieceId}:`, decrementError.message);
			}
		}

		if (legacyIds.length > 0) {
			const { error: updateError } = await /** @type {any} */ (supabaseAdmin)
				.from('products')
				.update({ in_stock: false })
				.in('id', legacyIds);
			if (updateError) {
				console.error('Failed to update legacy stock:', updateError.message);
			}
		}

		// ── 2c. Refresh in_stock on any bundles built from the pieces
		// that just changed, so the storefront's "in stock" filter (a
		// plain SQL column check) doesn't lag behind reality. The exact
		// available count is always recomputed live on read regardless —
		// this just keeps the stored flag from going stale.
		if (pieceDecrements.size > 0) {
			const changedPieceIds = Array.from(pieceDecrements.keys());
			const { data: affectedBundles } = await /** @type {any} */ (supabaseAdmin)
				.from('products')
				.select('id, bundle_component_ids')
				.overlaps('bundle_component_ids', changedPieceIds);

			if (affectedBundles?.length > 0) {
				const allComponentIds = Array.from(
					new Set(affectedBundles.flatMap((/** @type {any} */ b) => b.bundle_component_ids))
				);
				const { data: componentRows } = await supabaseAdmin
					.from('products')
					.select('id, stock_quantity')
					.in('id', allComponentIds);
				const stockById = new Map(
					(/** @type {any[]} */ (componentRows) ?? []).map((c) => [c.id, c.stock_quantity])
				);

				for (const bundle of affectedBundles) {
					const available = Math.min(
						...bundle.bundle_component_ids.map((/** @type {string} */ id) => stockById.get(id) ?? 0)
					);
					await /** @type {any} */ (supabaseAdmin)
						.from('products')
						.update({ in_stock: available > 0 })
						.eq('id', bundle.id);
				}
			}
		}
	}

	return json({ received: true });
}
