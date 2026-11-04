import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';
import { getShippingFeeForZip } from '$lib/server/shippingRates.js';

/**
 * POST /api/shipping-quote
 *
 * Pre-checkout shipping fee preview. Expected body: { zip: string }.
 * Not authenticated — reveals a shipping fee for a ZIP, same public
 * trust level as browsing product prices. Checkout recomputes this
 * fee server-side independently rather than trusting this response.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const zip = body?.zip;
	if (!zip) {
		return json({ error: 'ZIP code is required.' }, { status: 400 });
	}

	const result = await getShippingFeeForZip(supabaseAdmin, zip);

	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}

	return json({ fee: result.fee, label: result.label });
}
