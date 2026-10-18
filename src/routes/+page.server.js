import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';
import { buildProductQuery } from '$lib/server/productFilters.js';
import { prioritizeImages } from '$lib/server/productImages.js';

const NEW_ARRIVALS_LIMIT = 8;
const WASHER_DRYER_LIMIT = 6;

/**
 * Load quotes + product highlights for the home page.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ url }) {
	const { data: quotes, error: quotesError } = await supabase
		.from('quotes')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(6);

	if (quotesError) {
		console.error('Failed to load quotes:', quotesError.message);
	}

	// Fetch a larger pool than needed so products with a broken/missing image
	// can be pushed to the back rather than shrinking the section.
	const { query: newArrivalsQuery } = buildProductQuery(supabase, {
		inStock: 'true',
		sort: 'newest'
	});
	const { data: newArrivalsPool, error: newArrivalsError } = await newArrivalsQuery.limit(
		NEW_ARRIVALS_LIMIT * 3
	);

	if (newArrivalsError) {
		console.error('Failed to load new arrivals:', newArrivalsError.message);
	}

	// Washers & dryers aren't a real subcategory — auto-detect by name within
	// Appliances (see src/lib/server/productFilters.js WASHER_DRYER_FILTER).
	const { query: washerDryerQuery } = buildProductQuery(supabase, {
		washerDryer: true,
		inStock: 'true',
		sort: 'newest'
	});
	const { data: washerDryerPool, error: washerDryerError } = await washerDryerQuery.limit(
		WASHER_DRYER_LIMIT * 3
	);

	if (washerDryerError) {
		console.error('Failed to load washer/dryer products:', washerDryerError.message);
	}

	const newArrivals = await withComputedStock(
		supabase,
		prioritizeImages(newArrivalsPool ?? [], NEW_ARRIVALS_LIMIT)
	);
	const washerDryerProducts = await withComputedStock(
		supabase,
		prioritizeImages(washerDryerPool ?? [], WASHER_DRYER_LIMIT)
	);

	const { data: categories } = await supabase
		.from('categories')
		.select('value, label')
		.eq('is_active', true);

	const categoryMap = new Map((categories ?? []).map((cat) => [cat.value, cat.label]));

	/** @param {any[]} products */
	const withLabels = (products) =>
		(products ?? []).map((product) => ({
			...product,
			categoryLabel: categoryMap.get(product.category) || product.category
		}));

	return {
		quotes: quotes ?? [],
		newArrivals: withLabels(newArrivals),
		washerDryerProducts: withLabels(washerDryerProducts),
		canonicalUrl: `${url.origin}/`
	};
}
