import { supabaseAdmin } from '$lib/server/supabase.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const { count } = await supabaseAdmin
		.from('shipping_rates')
		.select('id', { count: 'exact', head: true })
		.eq('is_active', true);

	return { hasShippingRates: (count ?? 0) > 0 };
}
