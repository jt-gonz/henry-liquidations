import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';
import { parseProductFilters, buildProductQuery } from '$lib/server/productFilters.js';
import { hasReliableImage } from '$lib/server/productImages.js';

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
	const filters = parseProductFilters(url.searchParams);
	const { query: baseQuery, sortCol, sortAsc } = buildProductQuery(supabase, filters);
	let query = baseQuery;

	// ── Cursor-based pagination ─────────────────────────────
	if (cursor) {
		const separatorIndex = cursor.lastIndexOf('|');
		const cursorValue = separatorIndex >= 0 ? cursor.slice(0, separatorIndex) : '';
		const cursorId = separatorIndex >= 0 ? cursor.slice(separatorIndex + 1) : '';

		// Sorting by price means the cursor value must be numeric — reject
		// malformed cursors rather than interpolating untrusted input.
		const isValidCursorValue =
			sortCol === 'price' ? cursorValue !== '' && !isNaN(Number(cursorValue)) : cursorValue !== '';

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

	const rawProducts = data ?? [];
	const total = count ?? 0;

	// Recompute live, bundle-aware stock (see src/lib/server/stock.js)
	const products = await withComputedStock(supabase, rawProducts);

	// Fetch categories to map values to labels
	const { data: categories } = await supabase
		.from('categories')
		.select('value, label')
		.eq('is_active', true);

	const categoryMap = new Map((categories ?? []).map((cat) => [cat.value, cat.label]));

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
