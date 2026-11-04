import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';

/**
 * Load a single product by its slug.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ params, url }) {
	const { data: product, error: dbError } = await supabase
		.from('products')
		.select('*')
		.eq('slug', params.slug ?? '')
		.single();

	if (dbError || !product) {
		throw error(404, 'Product not found');
	}

	// Neither depends on the other's result — fetch concurrently.
	const [[productWithStock], { data: category }] = await Promise.all([
		withComputedStock(supabase, [product]),
		product.category
			? supabase
					.from('categories')
					.select('label')
					.eq('value', product.category)
					.eq('is_active', true)
					.single()
			: Promise.resolve({ data: null })
	]);

	const categoryLabel = category?.label ?? product.category;

	// Strip query params (UTM/tracking params from shared links, etc.) so
	// the canonical always points to the clean URL, same as every other
	// page's canonical — url.href would otherwise leak them in.
	const canonicalUrl = `${url.origin}${url.pathname}`;

	return { product: productWithStock, categoryLabel, canonicalUrl };
}
