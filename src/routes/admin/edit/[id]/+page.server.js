import { fail, redirect, error } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';
import { trackServerEvent } from '$lib/analytics.js';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params }) => {
	const [{ data: product, error: fetchError }, { data: categories }] = await Promise.all([
		supabaseAdmin.from('products').select('*').eq('id', params.id).single(),
		supabase
			.from('categories')
			.select('id, value, label, sort_order')
			.eq('is_active', true)
			.order('sort_order', { ascending: true })
	]);

	if (fetchError || !product) {
		throw error(404, 'Product not found');
	}

	return { product, categories: categories ?? [] };
};

/**
 * Generates a URL-friendly slug from a product name.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * @param {string[]} storageFileNames
 */
async function cleanupUploadedFiles(storageFileNames) {
	if (storageFileNames.length === 0) return;
	await supabaseAdmin.storage.from('product-images').remove(storageFileNames);
}

/**
 * @type {import('./$types').Actions}
 */
export const actions = {
	default: async ({ request, params }) => {
		const form = await request.formData();

		const name = form.get('name')?.toString()?.trim() ?? '';
		const priceStr = form.get('price')?.toString() ?? '';
		const category = form.get('category')?.toString() ?? '';
		const description = form.get('description')?.toString()?.trim() ?? '';
		const newImageFiles = /** @type {File[]} */ (form.getAll('newImages'));
		const newImageIds = form.getAll('newImageIds').map((v) => v.toString());
		const imageOrderRaw = form.get('imageOrder')?.toString() ?? '';

		// ── Validation ──────────────────────────────────────────
		if (!name) return fail(400, { error: 'Product name is required.' });
		if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) < 0) {
			return fail(400, { error: 'A valid price is required.' });
		}
		if (!category) return fail(400, { error: 'Category is required.' });

		/** @type {unknown} */
		let imageOrder;
		try {
			imageOrder = JSON.parse(imageOrderRaw);
			if (!Array.isArray(imageOrder)) throw new Error('imageOrder is not an array');
		} catch {
			return fail(400, {
				error: 'Image data is out of sync. Please refresh the page and try again.'
			});
		}

		const price = Number(priceStr);
		const slug = slugify(name);

		// ── Parse optional dimensions ────────────────────────────
		const dimW = form.get('dim_width')?.toString();
		const dimH = form.get('dim_height')?.toString();
		const dimD = form.get('dim_depth')?.toString();
		const dimUnit = form.get('dim_unit')?.toString() ?? 'in';
		/** @type {import('$lib/types/database.js').ProductDimensions | null} */
		let dimensions = null;
		if (dimW || dimH || dimD) {
			dimensions = {
				...(dimW ? { width: Number(dimW) } : {}),
				...(dimH ? { height: Number(dimH) } : {}),
				...(dimD ? { depth: Number(dimD) } : {}),
				unit: dimUnit
			};
		}

		// ── Parse optional colors ────────────────────────────────
		/** @type {string[] | null} */
		let colors = null;
		try {
			const rawColors = form.get('colors')?.toString();
			if (rawColors) {
				const parsed = JSON.parse(rawColors);
				if (Array.isArray(parsed) && parsed.length > 0) {
					colors = parsed;
				}
			}
		} catch {
			/* ignore */
		}

		/** @type {import('$lib/types/database.js').ProductUpdate} */
		const updates = {
			name,
			description,
			price: Number(price),
			category,
			dimensions,
			colors
		};

		// ── Re-fetch the product's real current images ──────────
		// (not just what the client echoed back — guards against a stale tab
		// overwriting a since-changed product)
		const { data: existingProduct, error: fetchError } = await supabaseAdmin
			.from('products')
			.select('image_url')
			.eq('id', params.id)
			.single();

		if (fetchError || !existingProduct) {
			return fail(404, { error: 'This product could not be found. It may have been deleted.' });
		}

		/** @type {string[]} */
		const currentImageUrls = existingProduct.image_url ?? [];
		const currentImageSet = new Set(currentImageUrls);

		// ── Upload new images first — nothing destructive happens ───
		// until this succeeds.
		const validNewImages = newImageFiles.filter((f) => f && f.size > 0);
		/** @type {string[]} */
		const uploadedFileNames = [];
		/** @type {Map<string, string>} */
		const idToUrl = new Map();

		for (let i = 0; i < validNewImages.length; i++) {
			const imageFile = validNewImages[i];
			const ext = imageFile.name.split('.').pop() ?? 'jpg';
			const fileName = `${slug}-${Date.now()}-${i}.${ext}`;

			const { error: uploadError } = await supabaseAdmin.storage
				.from('product-images')
				.upload(fileName, imageFile, {
					contentType: imageFile.type,
					upsert: false
				});

			if (uploadError) {
				console.error('Image upload failed:', uploadError.message);
				await cleanupUploadedFiles(uploadedFileNames);
				return fail(500, { error: `Failed to upload image ${i + 1}.` });
			}

			uploadedFileNames.push(fileName);
			const { data: urlData } = supabaseAdmin.storage
				.from('product-images')
				.getPublicUrl(fileName);
			const id = newImageIds[i];
			if (id) idToUrl.set(id, urlData.publicUrl);
		}

		// ── Reconstruct the final image order from the client's token
		// list, resolving each token against either the freshly-uploaded
		// images or the product's real current images. Any token that
		// doesn't resolve means the client's view was stale — fail loudly
		// rather than silently guessing at the "right" order.
		/** @type {string[]} */
		const updatedImageUrls = [];
		let hasUnresolvedToken = false;

		for (const token of imageOrder) {
			if (typeof token !== 'string') {
				hasUnresolvedToken = true;
				break;
			}
			if (token.startsWith('new:')) {
				const resolvedUrl = idToUrl.get(token.slice(4));
				if (!resolvedUrl) {
					hasUnresolvedToken = true;
					break;
				}
				updatedImageUrls.push(resolvedUrl);
			} else {
				if (!currentImageSet.has(token)) {
					hasUnresolvedToken = true;
					break;
				}
				updatedImageUrls.push(token);
			}
		}

		if (hasUnresolvedToken) {
			await cleanupUploadedFiles(uploadedFileNames);
			return fail(400, {
				error: 'Image data changed since you loaded this page. Please refresh and try again.'
			});
		}

		if (updatedImageUrls.length === 0) {
			await cleanupUploadedFiles(uploadedFileNames);
			return fail(400, { error: 'Product must have at least one image.' });
		}

		updates.image_url = updatedImageUrls;

		// ── Update Product in Database ───────────────────────────
		const { error: updateError } = await /** @type {any} */ (supabaseAdmin)
			.from('products')
			.update(updates)
			.eq('id', params.id);

		if (updateError) {
			await cleanupUploadedFiles(uploadedFileNames);
			return fail(500, { error: 'Failed to update product.' });
		}

		// ── Only now — with the DB successfully pointing at the new set —
		// delete storage files for images that were dropped. This is the
		// last, least-reversible step, gated behind DB success so a failure
		// anywhere above leaves the product in its original, consistent state.
		const keptUrls = new Set(updatedImageUrls);
		const removedUrls = currentImageUrls.filter((url) => !keptUrls.has(url));
		if (removedUrls.length > 0) {
			const filesToDelete = [];
			for (const url of removedUrls) {
				const marker = '/product-images/';
				const idx = url.indexOf(marker);
				if (idx !== -1) filesToDelete.push(url.slice(idx + marker.length));
			}
			if (filesToDelete.length > 0) {
				const { error: removeError } = await supabaseAdmin.storage
					.from('product-images')
					.remove(filesToDelete);
				if (removeError) {
					// Non-fatal: the product record is already correctly saved,
					// this just leaves an orphaned file in storage.
					console.error('Failed to clean up removed images from storage:', removeError.message);
				}
			}
		}

		// Track product update
		trackServerEvent('product_updated', {
			product_id: params.id,
			product_name: name,
			product_price: price,
			product_category: category
		});

		throw redirect(303, '/admin');
	}
};
