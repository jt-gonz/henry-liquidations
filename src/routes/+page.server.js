import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';
import { buildProductQuery } from '$lib/server/productFilters.js';
import { prioritizeImages } from '$lib/server/productImages.js';

const NEW_ARRIVALS_LIMIT = 8;
const WASHER_DRYER_LIMIT = 6;

/**
 * Load quotes + product highlights for the home page.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ url }) {
	const { query: newArrivalsQuery } = buildProductQuery(supabase, {
		inStock: 'true',
		sort: 'newest'
	});
	const { query: washerDryerQuery } = buildProductQuery(supabase, {
		washerDryer: true,
		inStock: 'true',
		sort: 'newest'
	});

	// Independent reads — fetch concurrently instead of one-at-a-time.
	const [
		{ data: quotes, error: quotesError },
		{ data: newArrivalsPool, error: newArrivalsError },
		{ data: washerDryerPool, error: washerDryerError },
		{ data: categories }
	] = await Promise.all([
		supabase.from('quotes').select('*').order('created_at', { ascending: false }).limit(6),
		// Fetch a larger pool than needed so products with a broken/missing
		// image can be pushed to the back rather than shrinking the section.
		newArrivalsQuery.limit(NEW_ARRIVALS_LIMIT * 3),
		washerDryerQuery.limit(WASHER_DRYER_LIMIT * 3),
		supabase.from('categories').select('value, label').eq('is_active', true)
	]);

	if (quotesError) {
		console.error('Failed to load quotes:', quotesError.message);
	}
	if (newArrivalsError) {
		console.error('Failed to load new arrivals:', newArrivalsError.message);
	}
	if (washerDryerError) {
		console.error('Failed to load washer/dryer products:', washerDryerError.message);
	}

	const newArrivalsPicked = prioritizeImages(newArrivalsPool ?? [], NEW_ARRIVALS_LIMIT);
	const washerDryerPicked = prioritizeImages(washerDryerPool ?? [], WASHER_DRYER_LIMIT);

	// One withComputedStock call over both pools combined — it already
	// batches its component fetch internally (see src/lib/server/stock.js),
	// so this is one extra round trip total instead of two. A product can
	// legitimately appear in both pools (e.g. a recent washer/dryer item),
	// so look each pool back up by id from the computed results rather
	// than partitioning — that preserves duplicates exactly as the
	// previous two-separate-calls version did.
	const computed = await withComputedStock(supabase, [...newArrivalsPicked, ...washerDryerPicked]);
	const computedById = new Map(computed.map((p) => [p.id, p]));
	const newArrivals = newArrivalsPicked.map((p) => computedById.get(p.id));
	const washerDryerProducts = washerDryerPicked.map((p) => computedById.get(p.id));

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
		washerDryerProducts: withLabels(washerDryerProducts),
		canonicalUrl: `${url.origin}/`
	};
}
