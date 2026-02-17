import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';

/**
 * GET /api/products?limit=12&cursor=<created_at>|<id>&category=Living+Room&minPrice=10&maxPrice=500&inStock=true&search=sofa
 *
 * Returns a paginated list of products using cursor-based pagination.
 * Cursor format: "created_at|id" — both from the last item of the previous page.
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

	// Build the query
	let query = supabase.from('products').select('*', { count: 'exact' });

	// ── Filters ─────────────────────────────────────────────
	if (inStockParam === 'true') {
		query = query.eq('in_stock', true);
	} else if (inStockParam === 'false') {
		query = query.eq('in_stock', false);
	}
	// Default: show all when inStock is not specified

	if (category) {
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
	query = query.order('created_at', { ascending: false }).order('id', { ascending: false });

	// ── Cursor-based pagination ─────────────────────────────
	if (cursor) {
		const [cursorDate, cursorId] = cursor.split('|');
		if (cursorDate && cursorId) {
			// Get items older than the cursor (or same date but smaller id)
			query = query.or(
				`created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
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

	// Build the next cursor from the last item
	/** @type {string | null} */
	let nextCursor = null;
	if (products.length === limit) {
		const last = /** @type {any} */ (products[products.length - 1]);
		nextCursor = `${last.created_at}|${last.id}`;
	}

	return json({ products, limit, total, hasMore: !!nextCursor, nextCursor });
}
