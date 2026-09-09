import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

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
 * GET /api/products?limit=12&cursor=<sortValue>|<id>&category=Living+Room&minPrice=10&maxPrice=500&inStock=true&search=sofa&sort=newest&washerDryer=true
 *
 * Returns a paginated list of products using cursor-based pagination.
 * Cursor format: "<sort column value>|<id>" — both from the last item of the previous page,
 * where the sort column depends on the active `sort` param (created_at for "newest", price otherwise).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url }) {
	const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '12', 10)));
	const cursor = url.searchParams.get('cursor');
	const category = url.searchParams.get('category');
	const minPrice = url.searchParams.get('minPrice');
	const maxPrice = url.searchParams.get('maxPrice');
	const inStockParam = url.searchParams.get('inStock');
	const search = url.searchParams.get('search')?.trim();
	const washerDryer = url.searchParams.get('washerDryer') === 'true';
	const sortParam = url.searchParams.get('sort') ?? 'newest';
	const sort = SORT_OPTIONS[sortParam] ? sortParam : 'newest';
	const { col: sortCol, asc: sortAsc } = SORT_OPTIONS[sort];

	// Build the query
	let query = supabase.from('products').select('*', { count: 'exact' });

	// ── Filters ─────────────────────────────────────────────
	if (inStockParam === 'true') {
		query = query.eq('in_stock', true);
	} else if (inStockParam === 'false') {
		query = query.eq('in_stock', false);
	}
	// Default: show all when inStock is not specified

	// The "Washers & Dryers" quick filter is mutually exclusive with the
	// category filter — there's no dedicated subcategory, so it's a name
	// match within Appliances.
	if (washerDryer) {
		query = query.eq('category', 'APPLIANCES').or('name.ilike.%washer%,name.ilike.%dryer%');
	} else if (category) {
		// Support multiple categories comma-separated
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

	// ── Search (on-demand ilike) ────────────────────────────
	if (search && search.length > 0) {
		// Search across name and description using OR
		query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
	}

	// ── Ordering ────────────────────────────────────────────
	query = query.order(sortCol, { ascending: sortAsc }).order('id', { ascending: sortAsc });

	// ── Cursor-based pagination ─────────────────────────────
	if (cursor) {
		const separatorIndex = cursor.lastIndexOf('|');
		const cursorValue = separatorIndex >= 0 ? cursor.slice(0, separatorIndex) : '';
		const cursorId = separatorIndex >= 0 ? cursor.slice(separatorIndex + 1) : '';

		// Sorting by price means the cursor value must be numeric — reject
		// malformed cursors rather than interpolating untrusted input.
		const isValidCursorValue = sortCol === 'price' ? cursorValue !== '' && !isNaN(Number(cursorValue)) : cursorValue !== '';

		if (isValidCursorValue && cursorId) {
			const cmp = sortAsc ? 'gt' : 'lt';
			query = query.or(
				`${sortCol}.${cmp}.${cursorValue},and(${sortCol}.eq.${cursorValue},id.${cmp}.${cursorId})`
			);
		}
	}

	query = query.limit(limit);

	const { data, error, count } = await query;

	if (error) {
		console.error('Products API error:', error.message);
		return json(
			{ products: [], limit, total: 0, hasMore: false, nextCursor: null },
			{ status: 500 }
		);
	}

	const products = data ?? [];
	const total = count ?? 0;

	// Fetch categories to map values to labels
	const { data: categories } = await supabase
		.from('categories')
		.select('value, label')
		.eq('is_active', true);

	const categoryMap = new Map(
		(categories ?? []).map((cat) => [cat.value, cat.label])
	);

	// Add category labels to products
	const productsWithLabels = products.map((product) => ({
		...product,
		categoryLabel: categoryMap.get(product.category) || product.category
	}));

	// Build the next cursor from the last item
	/** @type {string | null} */
	let nextCursor = null;
	if (productsWithLabels.length === limit) {
		const last = /** @type {any} */ (productsWithLabels[productsWithLabels.length - 1]);
		nextCursor = `${last[sortCol]}|${last.id}`;
	}

	// Push products with a broken/missing image toward the end of this page
	// only — doesn't affect which items land on which page (cursor above is
	// already computed from the real DB order), just their order within it.
	productsWithLabels.sort((a, b) => Number(hasReliableImage(b)) - Number(hasReliableImage(a)));

	return json({ products: productsWithLabels, limit, total, hasMore: !!nextCursor, nextCursor });
}
