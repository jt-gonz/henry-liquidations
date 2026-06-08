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
		const imagesToRemove = form.get('imagesToRemove')?.toString() ?? '';
		const currentImages = form.get('currentImages')?.toString() ?? '[]';

		// ── Validation ──────────────────────────────────────────
		if (!name) return fail(400, { error: 'Product name is required.' });
		if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) < 0) {
			return fail(400, { error: 'A valid price is required.' });
		}
		if (!category) return fail(400, { error: 'Category is required.' });

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

		// ── Handle Image Management ──────────────────────────────
		// Parse current images and images to remove
		let currentImageUrls = [];
		try {
			currentImageUrls = JSON.parse(currentImages);
		} catch {
			// If parsing fails, fetch current images from database
			const { data: existingProduct } = await supabaseAdmin
				.from('products')
				.select('image_url')
				.eq('id', params.id)
				.single();
			currentImageUrls = existingProduct?.image_url ?? [];
		}

		const removeUrls = imagesToRemove ? imagesToRemove.split(',').filter(Boolean) : [];

		// Remove images from storage if requested
		if (removeUrls.length > 0) {
			const filesToDelete = [];
			for (const url of removeUrls) {
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
		}

		// Filter out removed images from current images
		let updatedImageUrls = currentImageUrls.filter((url) => !removeUrls.includes(url));

		// Upload new images if provided
		const validNewImages = newImageFiles.filter((f) => f && f.size > 0);
		if (validNewImages.length > 0) {
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
					return fail(500, { error: `Failed to upload image ${i + 1}.` });
				}

				const { data: urlData } = supabaseAdmin.storage
					.from('product-images')
					.getPublicUrl(fileName);
				updatedImageUrls.push(urlData.publicUrl);
			}
		}

		// Ensure at least one image remains
		if (updatedImageUrls.length === 0) {
			return fail(400, { error: 'Product must have at least one image.' });
		}

		updates.image_url = updatedImageUrls;

		// ── Update Product ──────────────────────────────────────
		// ── Update Product in Database ──────────────────────────
		const { error: updateError } = await /** @type {any} */ (supabaseAdmin)
			.from('products')
			.update(updates)
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Failed to update product.' });
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
