import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

/**
 * Load a single product by its slug.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ params }) {
	const { data: product, error: dbError } = await supabase
		.from('products')
		.select('*')
		.eq('slug', params.slug ?? '')
		.single();

	if (dbError || !product) {
		throw error(404, 'Product not found');
	}

	return { product };
}
