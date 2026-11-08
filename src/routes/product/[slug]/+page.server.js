import { error, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';

/**
 * Of a set's members, picks a sensible default to show first: the
 * fullest pre-built bundle (most components) if one exists and is in
 * stock, otherwise the first individual piece — preferring one that's
 * actually in stock over one that isn't, so a visitor isn't greeted
 * with a sold-out item by default when an available one exists.
 * @param {any[]} members
 */
function pickDefaultMember(members) {
	const bundles = members
		.filter((m) => m.bundle_component_ids?.length)
		.sort((a, b) => b.bundle_component_ids.length - a.bundle_component_ids.length);
	const pieces = members.filter((m) => !m.bundle_component_ids?.length);

	const inStockBundle = bundles.find((m) => m.in_stock);
	if (inStockBundle) return inStockBundle;

	const inStockPiece = pieces.find((m) => m.in_stock);
	if (inStockPiece) return inStockPiece;

	return bundles[0] ?? pieces[0] ?? members[0];
}

/**
 * Loads either a product set (grouping every piece/bundle of one
 * physical furniture collection) or a single standalone product,
 * normalized to the same `members`/`selectedId` shape either way —
 * the page template only needs one code path, showing a piece/bundle
 * selector whenever `members.length > 1`.
 *
 * A URL for an individual piece that belongs to a set 301-redirects
 * to that set's page with `?item=<piece-slug>` so existing bookmarks/
 * indexed search results keep working and land pre-selected on the
 * exact item that was linked.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ params, url }) {
	const slug = params.slug ?? '';

	/** @param {string} category */
	async function loadCategoryLabel(category) {
		if (!category) return category;
		const { data } = await supabase
			.from('categories')
			.select('label')
			.eq('value', category)
			.eq('is_active', true)
			.maybeSingle();
		return data?.label ?? category;
	}

	// ── 1. Is this a set's own slug? ───────────────────────────────
	const { data: set } = await supabase.from('product_sets').select('*').eq('slug', slug).maybeSingle();

	if (set) {
		const { data: rawMembers, error: membersError } = await supabase
			.from('products')
			.select('*')
			.eq('set_id', set.id);

		if (membersError || !rawMembers?.length) {
			throw error(404, 'Product not found');
		}

		const members = await withComputedStock(supabase, rawMembers);
		const itemParam = url.searchParams.get('item');
		const selected = members.find((m) => m.slug === itemParam) ?? pickDefaultMember(members);

		return {
			members,
			selectedId: selected.id,
			set,
			categoryLabel: await loadCategoryLabel(set.category),
			canonicalUrl: `${url.origin}/product/${set.slug}`
		};
	}

	// ── 2. Plain product lookup ─────────────────────────────────────
	const { data: product, error: dbError } = await supabase
		.from('products')
		.select('*')
		.eq('slug', slug)
		.maybeSingle();

	if (dbError || !product) {
		throw error(404, 'Product not found');
	}

	// ── 2a. Belongs to a set — redirect to the set's page, carrying
	// along which specific piece/bundle this link meant (this is also
	// exactly how search results for a specific piece land pre-selected
	// on that piece within the grouped page). ───────────────────────
	if (product.set_id) {
		const { data: ownerSet } = await supabase
			.from('product_sets')
			.select('slug')
			.eq('id', product.set_id)
			.maybeSingle();

		if (ownerSet) {
			const qs = new URLSearchParams(url.searchParams);
			qs.set('item', slug);
			throw redirect(301, `/product/${ownerSet.slug}?${qs.toString()}`);
		}
	}

	// ── 3. Standalone product with no set-mates — render exactly as a
	// normal single product always has. ─────────────────────────────
	const [withStock] = await withComputedStock(supabase, [product]);

	return {
		members: [withStock],
		selectedId: withStock.id,
		set: null,
		categoryLabel: await loadCategoryLabel(product.category),
		canonicalUrl: `${url.origin}${url.pathname}`
	};
}
