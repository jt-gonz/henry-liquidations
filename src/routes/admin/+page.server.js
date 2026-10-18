import { fail } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';
import { trackServerEvent } from '$lib/analytics.js';

const PAGE_SIZE = 25;

/**
 * Load one page of products for the admin dashboard table.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load({ url }) {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data: products, error, count } = await supabase
		.from('products')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) {
		console.error('Failed to load products:', error.message);
		return { products: [], page: 1, totalPages: 1, totalCount: 0, from: 0, to: 0 };
	}

	const totalCount = count ?? 0;

	return {
		products: products ?? [],
		page,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
		totalCount,
		from,
		to: Math.min(to, totalCount - 1)
	};
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

		// Track product deletion
		trackServerEvent('product_deleted', {
			product_id: id
		});

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
