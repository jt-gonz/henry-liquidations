import { fail } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';

/**
 * Load all products for the admin dashboard table.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
	const { data: products, error } = await supabase
		.from('products')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to load products:', error.message);
		return { products: [] };
	}

	return { products: products ?? [] };
}

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	/**
	 * Delete a product by ID.
	 */
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const imageUrls = form.get('image_urls')?.toString();

		if (!id) {
			return fail(400, { error: 'Product ID is required.' });
		}

		const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

		if (error) {
			console.error('Failed to delete product:', error.message);
			return fail(500, { error: 'Failed to delete product.' });
		}

		// Best-effort: delete all images from storage
		if (imageUrls) {
			try {
				const urls = JSON.parse(imageUrls);
				const filesToDelete = [];
				
				for (const url of urls) {
					const marker = '/product-images/';
					const idx = url.indexOf(marker);
					if (idx !== -1) {
						const filePath = url.slice(idx + marker.length);
						filesToDelete.push(filePath);
					}
				}
				
				if (filesToDelete.length > 0) {
					await supabaseAdmin.storage.from('product-images').remove(filesToDelete);
				}
			} catch (e) {
				console.error('Failed to delete images from storage:', e);
			}
		}

		return { deleted: true };
	}
};
