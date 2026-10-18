/**
 * Shared product-listing filter/sort logic, used by the shop page load,
 * the infinite-scroll API, and the homepage's product pool queries — kept
 * in one place so the "Washers & Dryers" rule, sort options, and search
 * clause can't drift out of sync between them.
 */

/** @type {Record<string, { col: 'created_at' | 'price', asc: boolean }>} */
export const SORT_OPTIONS = {
	newest: { col: 'created_at', asc: false },
	price_asc: { col: 'price', asc: true },
	price_desc: { col: 'price', asc: false }
};

/**
 * Washers & dryers aren't a real subcategory — there's no dedicated
 * `categories` row for them, so the quick filter/homepage spotlight both
 * detect them by name within Appliances. Single source of truth for that
 * rule.
 */
export const WASHER_DRYER_FILTER = {
	category: 'APPLIANCES',
	nameIlike: ['washer', 'dryer']
};

// Re-exported for server-side callers already importing from this file
// (sitemap.xml, admin/categories) — the canonical definition lives in
// $lib/constants/shop.js since that path is also importable client-side,
// unlike this $lib/server/ module.
export { WASHER_DRYER_SLUG } from '$lib/constants/shop.js';

/**
 * Normalizes the shop/products-API filter params from a URLSearchParams
 * into one consistent shape.
 * @param {URLSearchParams} searchParams
 */
export function parseProductFilters(searchParams) {
	const category = searchParams.get('category') ?? '';
	const minPrice = searchParams.get('minPrice') ?? '';
	const maxPrice = searchParams.get('maxPrice') ?? '';
	const inStock = searchParams.get('inStock') ?? 'true';
	const search = searchParams.get('search')?.trim() ?? '';
	const washerDryer = searchParams.get('washerDryer') === 'true';
	const sortParam = searchParams.get('sort') ?? 'newest';
	const sort = SORT_OPTIONS[sortParam] ? sortParam : 'newest';

	return { category, minPrice, maxPrice, inStock, search, washerDryer, sort };
}

/**
 * Applies category/washerDryer/price/search filters and sort order to a
 * Supabase `products` query. Stops short of `.limit()`/`.range()`/cursor
 * handling so each caller (page load = plain limit, API = cursor + limit,
 * homepage pools = larger over-fetch limit) stays in control of its own
 * pagination shape.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {{
 *   category?: string, minPrice?: string, maxPrice?: string,
 *   inStock?: string, search?: string, washerDryer?: boolean, sort?: string
 * }} filters
 */
export function buildProductQuery(client, filters = {}) {
	const { col: sortCol, asc: sortAsc } = SORT_OPTIONS[filters.sort ?? ''] ?? SORT_OPTIONS.newest;

	let query = client.from('products').select('*', { count: 'exact' });

	if (filters.inStock === 'true') {
		query = query.eq('in_stock', true);
	} else if (filters.inStock === 'false') {
		query = query.eq('in_stock', false);
	}

	if (filters.washerDryer) {
		query = query
			.eq('category', WASHER_DRYER_FILTER.category)
			.or(WASHER_DRYER_FILTER.nameIlike.map((term) => `name.ilike.%${term}%`).join(','));
	} else if (filters.category) {
		const cats = filters.category
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		if (cats.length === 1) {
			query = query.eq('category', cats[0]);
		} else if (cats.length > 1) {
			query = query.in('category', cats);
		}
	}

	if (filters.minPrice) {
		const min = Number(filters.minPrice);
		if (!isNaN(min)) query = query.gte('price', min);
	}
	if (filters.maxPrice) {
		const max = Number(filters.maxPrice);
		if (!isNaN(max)) query = query.lte('price', max);
	}

	if (filters.search && filters.search.length > 0) {
		const term = filters.search;
		// Also matches the raw category value (e.g. "RECLINER COLLECTION"),
		// so searching "recliner" now surfaces the right products even
		// without typing the exact product name.
		query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
	}

	query = query.order(sortCol, { ascending: sortAsc }).order('id', { ascending: sortAsc });

	return { query, sortCol, sortAsc };
}
