import { supabase } from '$lib/server/supabase.js';

const PAGE_SIZE = 12;

/** @type {Record<string, { col: 'created_at' | 'price', asc: boolean }>} */
const SORT_OPTIONS = {
	newest: { col: 'created_at', asc: false },
	price_asc: { col: 'price', asc: true },
	price_desc: { col: 'price', asc: false }
};

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
 * Load the first batch of products for the shop page.
 * Supports filters passed via URL search params.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ url }) {
	const category = url.searchParams.get('category') ?? '';
	const minPrice = url.searchParams.get('minPrice') ?? '';
	const maxPrice = url.searchParams.get('maxPrice') ?? '';
	const inStock = url.searchParams.get('inStock') ?? 'true';
	const search = url.searchParams.get('search')?.trim() ?? '';
	const washerDryer = url.searchParams.get('washerDryer') === 'true';
	const sortParam = url.searchParams.get('sort') ?? 'newest';
	const sort = SORT_OPTIONS[sortParam] ? sortParam : 'newest';
	const { col: sortCol, asc: sortAsc } = SORT_OPTIONS[sort];

	let query = supabase.from('products').select('*', { count: 'exact' });

	// Filters
	if (inStock === 'true') {
		query = query.eq('in_stock', true);
	} else if (inStock === 'false') {
		query = query.eq('in_stock', false);
	}

	// The "Washers & Dryers" quick filter is mutually exclusive with the
	// category dropdown — there's no dedicated subcategory, so it's a
	// name match within Appliances.
	if (washerDryer) {
		query = query.eq('category', 'APPLIANCES').or('name.ilike.%washer%,name.ilike.%dryer%');
	} else if (category) {
		const cats = category
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		if (cats.length === 1) {
			query = query.eq('category', cats[0]);
		} else if (cats.length > 1) {
			query = query.in('category', cats);
		}
	}

	if (minPrice) {
		const min = Number(minPrice);
		if (!isNaN(min)) query = query.gte('price', min);
	}
	if (maxPrice) {
		const max = Number(maxPrice);
		if (!isNaN(max)) query = query.lte('price', max);
	}

	if (search.length > 0) {
		query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
	}

	query = query
		.order(sortCol, { ascending: sortAsc })
		.order('id', { ascending: sortAsc })
		.limit(PAGE_SIZE);

	const { data, error, count } = await query;

	if (error) {
		console.error('Shop page load error:', error.message);
		return {
			products: [],
			total: 0,
			hasMore: false,
			nextCursor: null,
			filters: { category, minPrice, maxPrice, inStock, search, washerDryer, sort }
		};
	}

	const products = data ?? [];
	const total = count ?? 0;

	// Fetch categories to map values to labels
	const { data: categories } = await supabase
		.from('categories')
		.select('id, value, label, sort_order')
		.eq('is_active', true)
		.order('sort_order', { ascending: true });

	const categoryMap = new Map((categories ?? []).map((cat) => [cat.value, cat.label]));

	// Add category labels to products
	const productsWithLabels = products.map((product) => ({
		...product,
		categoryLabel: categoryMap.get(product.category) || product.category
	}));

	/** @type {string | null} */
	let nextCursor = null;
	if (productsWithLabels.length === PAGE_SIZE) {
		const last = /** @type {import('$lib/types/database.js').ProductRow} */ (
			productsWithLabels[productsWithLabels.length - 1]
		);
		nextCursor = `${last[sortCol]}|${last.id}`;
	}

	// Push products with a broken/missing image toward the end of this page
	// only — doesn't affect which items land on which page (cursor above is
	// already computed from the real DB order), just their order within it.
	productsWithLabels.sort((a, b) => Number(hasReliableImage(b)) - Number(hasReliableImage(a)));

	// Fetch global min/max prices for the slider
	const { data: minData } = await supabase
		.from('products')
		.select('price')
		.order('price', { ascending: true })
		.limit(1)
		.single();

	const { data: maxData } = await supabase
		.from('products')
		.select('price')
		.order('price', { ascending: false })
		.limit(1)
		.single();

	const globalMinPrice = /** @type {{ price: number } | null} */ (minData)?.price ?? 0;
	const globalMaxPrice = /** @type {{ price: number } | null} */ (maxData)?.price ?? 5000;

	return {
		products: productsWithLabels,
		total,
		hasMore: !!nextCursor,
		nextCursor,
		filters: { category, minPrice, maxPrice, inStock, search, washerDryer, sort },
		priceBounds: { min: globalMinPrice, max: globalMaxPrice },
		categories: categories ?? []
	};
}
