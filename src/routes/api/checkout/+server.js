import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { supabase } from '$lib/server/supabase.js';

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

	// ── 1. Look up authentic prices from the database ────────────
	const productIds = cartItems.map((/** @type {{ id: string }} */ i) => i.id);

	const { data: products, error: dbError } = await supabase
		.from('products')
		.select('id, name, price, in_stock, image_url')
		.in('id', productIds);

	if (dbError || !products) {
		console.error('Checkout DB error:', dbError?.message);
		return json({ error: 'Failed to verify products.' }, { status: 500 });
	}

	// Build a lookup map
	/** @type {Map<string, import('$lib/types/database.js').ProductRow>} */
	const productMap = new Map((/** @type {any[]} */ (products)).map((p) => [p.id, p]));

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

		const unitAmount = Math.round(Number(product.price) * 100); // cents

		lineItems.push({
			price_data: {
				currency: 'usd',
				product_data: {
					name: product.name,
					...(product.image_url ? { images: [product.image_url] } : {}),
					...(item.color ? { description: `Color: ${item.color}` } : {})
				},
				unit_amount: unitAmount
			},
			quantity: item.quantity
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
			// Store product IDs in metadata so the webhook can reference them
			metadata: {
				product_ids: JSON.stringify(
					cartItems.map((/** @type {{ id: string, quantity: number, color?: string }} */ i) => ({
						id: i.id,
						quantity: i.quantity,
						...(i.color ? { color: i.color } : {})
					}))
				)
			}
		});

		return json({ url: session.url });
	} catch (err) {
		console.error('Stripe session creation failed:', err);
		return json({ error: 'Failed to create checkout session.' }, { status: 500 });
	}
}
