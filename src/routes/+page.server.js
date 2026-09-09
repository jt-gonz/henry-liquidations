import { supabase } from '$lib/server/supabase.js';

const NEW_ARRIVALS_LIMIT = 8;
const WASHER_DRYER_LIMIT = 6;

/**
 * Whether a product's first image is likely to actually load. A handful of
 * products have filenames with unencoded commas/spaces that fail to load in
 * the browser — this can't be known for certain without fetching the URL,
 * but it's a cheap, effective heuristic for de-prioritizing the known cases.
 * @param {any} product
 */
function hasReliableImage(product) {
	const url = product.image_url?.[0];
	if (!url) return false;
	try {
		const filename = decodeURIComponent(url.split('/').pop() ?? '');
		return !/[,\s]/.test(filename);
	} catch {
		return false;
	}
}

/**
 * Sort products with a reliable image first (stable — preserves the
 * original ordering within each group), then take the first `limit`.
 * @param {any[]} products
 * @param {number} limit
 */
function prioritizeImages(products, limit) {
	return [...products]
		.sort((a, b) => Number(hasReliableImage(b)) - Number(hasReliableImage(a)))
		.slice(0, limit);
}

/**
 * Load quotes + product highlights for the home page.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
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
	const { data: newArrivalsPool, error: newArrivalsError } = await supabase
		.from('products')
		.select('*')
		.eq('in_stock', true)
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(NEW_ARRIVALS_LIMIT * 3);

	if (newArrivalsError) {
		console.error('Failed to load new arrivals:', newArrivalsError.message);
	}

	// Washers & dryers aren't a real subcategory — auto-detect by name within Appliances.
	const { data: washerDryerPool, error: washerDryerError } = await supabase
		.from('products')
		.select('*')
		.eq('category', 'APPLIANCES')
		.or('name.ilike.%washer%,name.ilike.%dryer%')
		.eq('in_stock', true)
		.order('created_at', { ascending: false })
		.limit(WASHER_DRYER_LIMIT * 3);

	if (washerDryerError) {
		console.error('Failed to load washer/dryer products:', washerDryerError.message);
	}

	const newArrivals = prioritizeImages(newArrivalsPool ?? [], NEW_ARRIVALS_LIMIT);
	const washerDryerProducts = prioritizeImages(washerDryerPool ?? [], WASHER_DRYER_LIMIT);

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
		washerDryerProducts: withLabels(washerDryerProducts)
	};
}
