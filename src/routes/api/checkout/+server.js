import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';
import { getColorName } from '$lib/constants/colors.js';
import { withComputedStock } from '$lib/server/stock.js';
import { getShippingFeeForZip } from '$lib/server/shippingRates.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * POST /api/checkout
 *
 * Receives cart items from the frontend, validates prices against the
 * database (never trust client-side prices), and creates a Stripe
 * Checkout Session. Returns the session URL for redirect.
 *
 * Expected body: { items: [{ id: string, quantity: number }] }
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, url }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const cartItems = body?.items;
	if (!Array.isArray(cartItems) || cartItems.length === 0) {
		return json({ error: 'Cart is empty.' }, { status: 400 });
	}

	const fulfillmentMethod = body?.fulfillmentMethod === 'ship' ? 'ship' : 'pickup';
	const zip = body?.zip;

	if (fulfillmentMethod === 'ship' && !zip) {
		return json({ error: 'A ZIP code is required for shipping.' }, { status: 400 });
	}

	// ── 1. Look up authentic prices from the database ────────────
	const productIds = cartItems.map((/** @type {{ id: string }} */ i) => i.id);

	const { data: rawProducts, error: dbError } = await supabase
		.from('products')
		.select('id, name, price, in_stock, image_url, stock_quantity, bundle_component_ids')
		.in('id', productIds);

	if (dbError || !rawProducts) {
		console.error('Checkout DB error:', dbError?.message);
		return json({ error: 'Failed to verify products.' }, { status: 500 });
	}

	// Bundle-aware availability: a bundle's stored in_stock can lag behind
	// its components selling elsewhere, so recompute live rather than
	// trusting the column — this is the last check before charging a card.
	const products = await withComputedStock(supabase, rawProducts);

	// Build a lookup map
	const productMap = new Map(products.map((p) => [p.id, p]));

	// ── 2. Build Stripe line_items with verified prices ──────────
	/** @type {Stripe.Checkout.SessionCreateParams.LineItem[]} */
	const lineItems = [];

	for (const item of cartItems) {
		const product = productMap.get(item.id);

		if (!product) {
			return json({ error: `Product not found: ${item.id}` }, { status: 400 });
		}
		if (!product.in_stock) {
			return json({ error: `"${product.name}" is no longer available.` }, { status: 400 });
		}
		if (
			product.available_quantity !== null &&
			product.available_quantity !== undefined &&
			item.quantity > product.available_quantity
		) {
			return json(
				{
					error:
						product.available_quantity === 0
							? `"${product.name}" is no longer available.`
							: `Only ${product.available_quantity} of "${product.name}" left in stock.`
				},
				{ status: 400 }
			);
		}

		const unitAmount = Math.round(Number(product.price) * 100); // cents

		lineItems.push({
			price_data: {
				currency: 'usd',
				product_data: {
					name: product.name,
					...(product.image_url?.[0] ? { images: [product.image_url[0]] } : {}),
					...(item.color ? { description: `Color: ${getColorName(item.color)}` } : {})
				},
				unit_amount: unitAmount
			},
			quantity: item.quantity
		});
	}

	// ── 2b. Compute the shipping fee server-side (never trust the
	// client's earlier /api/shipping-quote response — same defensive
	// posture as the product prices above) ───────────────────────
	let shippingFee = null;
	let shippingLabel = null;
	if (fulfillmentMethod === 'ship') {
		const shippingResult = await getShippingFeeForZip(supabaseAdmin, zip);
		if ('error' in shippingResult) {
			return json({ error: shippingResult.error }, { status: 400 });
		}
		shippingFee = shippingResult.fee;
		shippingLabel = shippingResult.label;

		lineItems.push({
			price_data: {
				currency: 'usd',
				product_data: { name: shippingLabel || 'Shipping' },
				unit_amount: Math.round(shippingFee * 100)
			},
			quantity: 1
		});
	}

	// ── 3. Create Stripe Checkout Session ────────────────────────
	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: lineItems,
			success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/checkout/cancel`,
			// Collect customer email on Stripe's hosted page
			customer_creation: 'if_required',
			...(fulfillmentMethod === 'ship'
				? { shipping_address_collection: { allowed_countries: ['US'] } }
				: {}),
			// Store product IDs + fulfillment info in metadata so the webhook can
			// reference them. Stripe caps each metadata value at 500 characters,
			// so this intentionally omits `color` (the webhook never reads it —
			// it's only used above for the Stripe line item's own description)
			// and uses a compact [id, quantity] tuple instead of a keyed object
			// to fit more items per cart before hitting that cap.
			metadata: {
				product_ids: JSON.stringify(
					cartItems.map((/** @type {{ id: string, quantity: number }} */ i) => [i.id, i.quantity])
				),
				fulfillment_method: fulfillmentMethod,
				...(fulfillmentMethod === 'ship'
					? { shipping_zip: zip, shipping_fee: String(shippingFee) }
					: {})
			}
		});

		// Store the full cart (no size cap, unlike Stripe metadata above) so
		// the webhook can reconstruct the order without relying on metadata
		// at all. Best-effort: metadata.product_ids above still exists as a
		// fallback the webhook checks if this write fails or this row is
		// somehow missing by the time the webhook fires.
		const { error: pendingError } = await supabaseAdmin.from('pending_checkout_items').insert({
			session_id: session.id,
			items: cartItems.map((/** @type {{ id: string, quantity: number, color?: string }} */ i) => ({
				id: i.id,
				quantity: i.quantity,
				...(i.color ? { color: i.color } : {})
			}))
		});
		if (pendingError) {
			console.error('Failed to store pending checkout items:', pendingError.message);
		}

		return json({ url: session.url });
	} catch (err) {
		console.error('Stripe session creation failed:', err);
		return json({ error: 'Failed to create checkout session.' }, { status: 500 });
	}
}
