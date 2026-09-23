import { fail } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';
import { computeAvailability } from '$lib/server/stock.js';
import { trackServerEvent } from '$lib/analytics.js';

/**
 * Load every product for the inventory view, with live bundle-aware
 * availability computed for each one. Loaded in a single pass (rather
 * than reusing withComputedStock's per-page component fetch) since here
 * we need every product in memory anyway to also show a bundle's
 * component names.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
	const { data, error } = await supabase
		.from('products')
		.select('id, name, slug, price, category, image_url, in_stock, stock_quantity, bundle_component_ids')
		.order('name', { ascending: true });

	if (error) {
		console.error('Failed to load inventory:', error.message);
		return { products: [] };
	}

	const products = /** @type {any[]} */ (data ?? []);
	const byId = new Map(products.map((p) => [p.id, p]));

	const withAvailability = products.map((product) => {
		const { available, inStock } = computeAvailability(product, byId);
		const componentNames = (product.bundle_component_ids ?? [])
			.map((/** @type {string} */ id) => byId.get(id)?.name)
			.filter(Boolean);
		return {
			...product,
			available_quantity: available,
			in_stock: inStock,
			is_bundle: (product.bundle_component_ids?.length ?? 0) > 0,
			component_names: componentNames
		};
	});

	return { products: withAvailability };
}

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	/**
	 * Update a standalone piece's stock quantity. Bundles have nothing to
	 * update here — their availability is always derived from components.
	 */
	updateQuantity: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const quantityRaw = form.get('quantity')?.toString() ?? '';

		if (!id) return fail(400, { error: 'Product ID is required.' });
		if (quantityRaw === '' || isNaN(Number(quantityRaw)) || Number(quantityRaw) < 0) {
			return fail(400, { error: 'Enter a valid quantity (0 or more).' });
		}

		const quantity = Math.floor(Number(quantityRaw));

		const { error } = await /** @type {any} */ (supabaseAdmin)
			.from('products')
			.update({ stock_quantity: quantity, in_stock: quantity > 0 })
			.eq('id', id);

		if (error) {
			console.error('Failed to update stock quantity:', error.message);
			return fail(500, { error: 'Failed to update stock quantity.' });
		}

		trackServerEvent('inventory_quantity_updated', { product_id: id, quantity });

		return { updated: id };
	},

	/**
	 * Toggle in_stock directly for legacy items that don't track a
	 * quantity at all.
	 */
	toggleInStock: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const inStock = form.get('in_stock')?.toString() === 'true';

		if (!id) return fail(400, { error: 'Product ID is required.' });

		const { error } = await /** @type {any} */ (supabaseAdmin)
			.from('products')
			.update({ in_stock: inStock })
			.eq('id', id);

		if (error) {
			console.error('Failed to toggle stock status:', error.message);
			return fail(500, { error: 'Failed to update stock status.' });
		}

		trackServerEvent('inventory_stock_toggled', { product_id: id, in_stock: inStock });

		return { updated: id };
	}
};
