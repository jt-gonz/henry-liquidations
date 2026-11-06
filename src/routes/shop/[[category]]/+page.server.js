import { error, redirect } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';
import { parseProductFilters, buildProductQuery, WASHER_DRYER_SLUG } from '$lib/server/productFilters.js';
import { hasReliableImage } from '$lib/server/productImages.js';

const PAGE_SIZE = 12;
const SITE_NAME = "Henry's Liquidation Store";

/**
 * Load the first batch of products for the shop page. Supports filters via
 * URL search params, plus an optional `/shop/{category}` path segment that
 * resolves to a real, server-rendered, individually-titled category
 * landing page (better for SEO than query-param-only filtering).
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ url, params, cookies }) {
	const { data: categoriesData } = await supabase
		.from('categories')
		.select('id, value, label, slug, sort_order')
		.eq('is_active', true)
		.order('sort_order', { ascending: true });
	const categories = categoriesData ?? [];

	// ── Legacy query-param links (?category=X, ?washerDryer=true) 301 to
	// the equivalent path-based URL, consolidating any existing link
	// equity / indexed URLs onto the new canonical location.
	const legacyCategoryValue = url.searchParams.get('category');
	const legacyWasherDryer = url.searchParams.get('washerDryer') === 'true';
	if (!params.category && (legacyCategoryValue || legacyWasherDryer)) {
		const remaining = new URLSearchParams(url.searchParams);
		remaining.delete('category');
		remaining.delete('washerDryer');
		const qs = remaining.toString();
		const targetSlug = legacyWasherDryer
			? WASHER_DRYER_SLUG
			: (categories.find((c) => c.value === legacyCategoryValue)?.slug ?? null);
		if (targetSlug) {
			throw redirect(301, `/shop/${targetSlug}${qs ? '?' + qs : ''}`);
		}
	}

	// ── Resolve the category from the path segment ────────────
	let categoryRow = null;
	let washerDryer = false;
	if (params.category === WASHER_DRYER_SLUG) {
		washerDryer = true;
	} else if (params.category) {
		categoryRow = categories.find((c) => c.slug === params.category) ?? null;
		if (!categoryRow) throw error(404, 'Category not found');
	}

	const filters = parseProductFilters(url.searchParams);
	filters.category = categoryRow?.value ?? '';
	filters.washerDryer = washerDryer;

	const { query, sortCol } = buildProductQuery(supabase, filters);
	const { data, error: queryError, count } = await query.limit(PAGE_SIZE);

	const categoryMap = new Map(categories.map((cat) => [cat.value, cat.label]));

	/** @param {string | undefined} slug */
	const seoMeta = (slug) => {
		if (categoryRow) {
			return {
				pageTitle: `${categoryRow.label} | ${SITE_NAME}`,
				pageDescription: `Shop discounted ${categoryRow.label} at liquidation prices. New arrivals added daily.`
			};
		}
		if (washerDryer) {
			return {
				pageTitle: `Washers & Dryers | ${SITE_NAME}`,
				pageDescription: 'Shop discounted washers and dryers at liquidation prices. New arrivals added daily.'
			};
		}
		return {
			pageTitle: `Shop Collection | ${SITE_NAME}`,
			pageDescription:
				'Browse our full collection of liquidation furniture and appliances, including washers and dryers. Filter by category, price, and availability.'
		};
	};

	const { pageTitle, pageDescription } = seoMeta(params.category);
	const canonicalUrl = `${url.origin}/shop${params.category ? '/' + params.category : ''}`;

	if (queryError) {
		console.error('Shop page load error:', queryError.message);
		return {
			products: [],
			total: 0,
			hasMore: false,
			nextCursor: null,
			filters,
			categorySlug: params.category ?? '',
			categories,
			pageTitle,
			pageDescription,
			canonicalUrl
		};
	}

	const rawProducts = data ?? [];
	const total = count ?? 0;

	// Best-effort: log the search so zero-result terms can be reviewed later
	// (see the Design Signal Playbook). Awaited (not fire-and-forget) since
	// an unawaited promise isn't guaranteed to finish before a serverless
	// function's response is sent — same posture as the page_views insert
	// in hooks.server.js.
	if (filters.search) {
		try {
			const { error: logError } = await supabaseAdmin.from('search_queries').insert({
				term: filters.search,
				result_count: total,
				category: filters.category || null,
				visitor_id: cookies.get('vid') ?? null
			});
			if (logError) console.error('Failed to log search query:', logError.message);
		} catch (err) {
			console.error('Failed to log search query:', err);
		}
	}

	// Recompute live, bundle-aware stock (a bundle's stored in_stock can go
	// briefly stale between sales of its components — see src/lib/server/stock.js)
	const products = await withComputedStock(supabase, rawProducts);

	// Add category labels to products
	const productsWithLabels = /** @type {any[]} */ (products).map((product) => ({
		...product,
		categoryLabel: categoryMap.get(product.category) || product.category
	}));

	/** @type {string | null} */
	let nextCursor = null;
	if (productsWithLabels.length === PAGE_SIZE) {
		const last = /** @type {any} */ (productsWithLabels[productsWithLabels.length - 1]);
		nextCursor = `${last[sortCol]}|${last.id}`;
	}

	// Push products with a broken/missing image toward the end of this page
	// only — doesn't affect which items land on which page (cursor above is
	// already computed from the real DB order), just their order within it.
	productsWithLabels.sort((a, b) => Number(hasReliableImage(b)) - Number(hasReliableImage(a)));

	return {
		products: productsWithLabels,
		total,
		hasMore: !!nextCursor,
		nextCursor,
		filters,
		categorySlug: params.category ?? '',
		categories,
		pageTitle,
		pageDescription,
		canonicalUrl
	};
}
