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
 * Escapes a value for safe interpolation into a raw PostgREST `.or()`
 * filter string. Without this, a search term containing a comma, period,
 * or parenthesis would be parsed as extra filter syntax instead of a
 * literal value — wrapping in double quotes (with internal backslashes/
 * quotes escaped) is the escaping PostgREST itself expects there.
 * @param {string} value
 */
function escapeOrValue(value) {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Escapes POSIX regex metacharacters so a literal word can be dropped into a `~*` pattern.
 * @param {string} value
 */
function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

	// Join each product's set (if it has one) so a listing card can link
	// to the set's own page and show an "N options" badge, without an
	// extra query per card.
	let query = client.from('products').select('*, product_sets(slug, name, member_count)', { count: 'exact' });

	// A set's members would otherwise each show up as their own grid
	// card — the exact "duplicate-looking items from the same set"
	// problem product_sets exists to fix. Only the one flagged member
	// per set appears in browse/category grids. Search is deliberately
	// exempted: finding "nightstand" should surface that exact piece
	// (pre-selected on its set's page), not just whichever piece
	// happens to be the set's default card.
	if (!filters.search) {
		query = query.eq('is_primary_listing', true);
	}

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
		// Match word-by-word (AND across words, OR across columns) instead of
		// the whole phrase as one substring, so "bed queen" and "queen bed"
		// both surface "Queen Bed Frame" regardless of word order. Each
		// .or() call below becomes its own AND'd condition — chaining them
		// is what gives the AND-of-ORs shape.
		const words = filters.search.split(/\s+/).filter(Boolean).slice(0, 8);

		for (const word of words) {
			const likePattern = escapeOrValue(`%${word}%`);
			// Category is matched as a whole word, not a plain substring —
			// category values are underscore-joined collection names (e.g.
			// "BEDROOM_COLLECTION"), and a substring match would make a common
			// word like "bed" match nearly every bedroom product. Boundaries are
			// start/end-of-string or an underscore (not `\y`, which treats `_`
			// as a word character and so would never match "bedroom" inside
			// "BEDROOM_COLLECTION"). Whole-word matching still lets "recliner"
			// surface "RECLINER_COLLECTION" without needing the exact product name.
			const categoryPattern = escapeOrValue(`(^|_)${escapeRegex(word)}($|_)`);
			query = query.or(
				`name.ilike.${likePattern},description.ilike.${likePattern},category.imatch.${categoryPattern}`
			);
		}

		// A bundle's name is every one of its pieces strung together
		// ("King Bed Frame - Dresser - Mirror - Chest - Nightstand"), so
		// it incidentally matches a search for any single component word
		// — showing up as a second, same-image card right next to the
		// individual piece that's the actual relevant result. Bundles
		// are still fully discoverable (and purchasable) from their
		// set's own page; search is for finding one specific item.
		query = query.is('bundle_component_ids', null);
	}

	query = query.order(sortCol, { ascending: sortAsc }).order('id', { ascending: sortAsc });

	return { query, sortCol, sortAsc };
}
