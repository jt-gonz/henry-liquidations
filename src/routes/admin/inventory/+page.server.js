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
	 * Delete a product by ID.
	 */
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();

		if (!id) return fail(400, { error: 'Product ID is required.' });

		// Re-fetch the product's real image URLs server-side rather than
		// trusting whatever the client posted — the delete form shouldn't be
		// able to tell storage to remove arbitrary paths that don't actually
		// belong to the product being deleted (same posture as the edit
		// action's image handling in admin/edit/[id]/+page.server.js).
		const { data: existingProduct } = await supabaseAdmin
			.from('products')
			.select('image_url')
			.eq('id', id)
			.single();

		const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

		if (error) {
			console.error('Failed to delete product:', error.message);
			return fail(500, { error: 'Failed to delete product.' });
		}

		trackServerEvent('product_deleted', { product_id: id });

		// Best-effort: delete all images from storage
		const imageUrls = /** @type {any} */ (existingProduct)?.image_url;
		if (imageUrls?.length > 0) {
			try {
				const filesToDelete = [];
				for (const url of imageUrls) {
					const marker = '/product-images/';
					const idx = url.indexOf(marker);
					if (idx !== -1) filesToDelete.push(url.slice(idx + marker.length));
				}
				if (filesToDelete.length > 0) {
					await supabaseAdmin.storage.from('product-images').remove(filesToDelete);
				}
			} catch (e) {
				console.error('Failed to delete images from storage:', e);
			}
		}

		return { deleted: true };
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
