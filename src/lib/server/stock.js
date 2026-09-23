/**
 * Bundle-aware stock computation.
 *
 * A "piece" product tracks its own stock_quantity. A "bundle" product
 * (bundle_component_ids set) has no stock of its own — its availability
 * is always the minimum stock_quantity across its component pieces, so
 * selling a piece (standalone or as part of any bundle) instantly and
 * correctly affects every bundle that needs it, with nothing to keep in
 * sync by hand.
 *
 * Legacy products (stock_quantity is null, bundle_component_ids is null)
 * fall back to the original in_stock boolean with no numeric count.
 */

/**
 * @typedef {Object} StockAwareProduct
 * @property {string} id
 * @property {number|null} [stock_quantity]
 * @property {string[]|null} [bundle_component_ids]
 * @property {boolean} in_stock
 */

/**
 * @param {StockAwareProduct} product
 * @param {Map<string, StockAwareProduct>} [componentsById] Must contain every id in product.bundle_component_ids.
 * @returns {{ available: number|null, inStock: boolean }}
 */
export function computeAvailability(product, componentsById = new Map()) {
	if (product.bundle_component_ids && product.bundle_component_ids.length > 0) {
		let min = /** @type {number|null} */ (null);
		for (const id of product.bundle_component_ids) {
			const component = componentsById.get(id);
			const qty = component?.stock_quantity;
			if (qty === null || qty === undefined) {
				// A component with no tracked quantity can't confirm this
				// bundle is available — treat as unavailable rather than
				// risk overselling it.
				return { available: 0, inStock: false };
			}
			min = min === null ? qty : Math.min(min, qty);
		}
		return { available: min ?? 0, inStock: (min ?? 0) > 0 };
	}

	if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
		return { available: product.stock_quantity, inStock: product.stock_quantity > 0 };
	}

	// Legacy single-unit item: no quantity tracked, trust the boolean.
	return { available: null, inStock: !!product.in_stock };
}

/**
 * Fetch every distinct component product referenced by a list of
 * products' bundle_component_ids, keyed by id — ready to pass into
 * computeAvailability.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {StockAwareProduct[]} products
 * @returns {Promise<Map<string, StockAwareProduct>>}
 */
export async function fetchComponentsById(supabaseClient, products) {
	const ids = new Set();
	for (const p of products) {
		for (const id of p.bundle_component_ids ?? []) ids.add(id);
	}
	if (ids.size === 0) return new Map();

	const { data, error } = await supabaseClient
		.from('products')
		.select('id, stock_quantity, bundle_component_ids, in_stock')
		.in('id', Array.from(ids));

	if (error || !data) return new Map();
	return new Map(data.map((row) => [row.id, row]));
}

/**
 * Convenience wrapper: fetch components for a list of products and
 * return the same products with `in_stock` recomputed live and a new
 * `available_quantity` (number of units left, or null for legacy
 * boolean-only items) — the only two fields the UI needs to care about.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {StockAwareProduct[]} products
 * @returns {Promise<any[]>}
 */
export async function withComputedStock(supabaseClient, products) {
	const componentsById = await fetchComponentsById(supabaseClient, products);
	return products.map((product) => {
		const { available, inStock } = computeAvailability(product, componentsById);
		return { ...product, available_quantity: available, in_stock: inStock };
	});
}
