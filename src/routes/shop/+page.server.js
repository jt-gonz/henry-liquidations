import { supabase } from '$lib/server/supabase.js';

const PAGE_SIZE = 12;

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

	let query = supabase
		.from('products')
		.select('*', { count: 'exact' });

	// Filters
	if (inStock === 'true') {
		query = query.eq('in_stock', true);
	} else if (inStock === 'false') {
		query = query.eq('in_stock', false);
	}

	if (category) {
		const cats = category.split(',').map((c) => c.trim()).filter(Boolean);
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
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(PAGE_SIZE);

	const { data, error, count } = await query;

	if (error) {
		console.error('Shop page load error:', error.message);
		return { products: [], total: 0, hasMore: false, nextCursor: null, filters: { category, minPrice, maxPrice, inStock, search } };
	}

	const products = data ?? [];
	const total = count ?? 0;

	/** @type {string | null} */
	let nextCursor = null;
	if (products.length === PAGE_SIZE) {
		const last = /** @type {import('$lib/types/database.js').ProductRow} */ (products[products.length - 1]);
		nextCursor = `${last.created_at}|${last.id}`;
	}

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
		products,
		total,
		hasMore: !!nextCursor,
		nextCursor,
		filters: { category, minPrice, maxPrice, inStock, search },
		priceBounds: { min: globalMinPrice, max: globalMaxPrice }
	};
}
