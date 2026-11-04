import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const { data: order, error: fetchError } = await supabaseAdmin
		.from('orders')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError || !order) {
		throw error(404, 'Order not found');
	}

	return { order };
}
