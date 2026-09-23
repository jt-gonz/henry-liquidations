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

	const [productWithStock] = await withComputedStock(supabase, [product]);

	// Fetch the category label
	let categoryLabel = product.category; // Default to the value if not found
	if (product.category) {
		const { data: category } = await supabase
			.from('categories')
			.select('label')
			.eq('value', product.category)
			.eq('is_active', true)
			.single();
		
		if (category) {
			categoryLabel = category.label;
		}
	}

	return { product: productWithStock, categoryLabel, canonicalUrl: url.href };
}
