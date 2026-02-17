import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';

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

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();

		const name = form.get('name')?.toString()?.trim() ?? '';
		const priceStr = form.get('price')?.toString() ?? '';
		const category = form.get('category')?.toString() ?? '';
		const description = form.get('description')?.toString()?.trim() ?? '';
		const imageFile = /** @type {File | null} */ (form.get('image'));

		// ── Validation ──────────────────────────────────────────
		if (!name)
			return fail(400, {
				error: 'Product name is required.',
				name,
				price: priceStr,
				category,
				description
			});
		if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) < 0) {
			return fail(400, {
				error: 'A valid price is required.',
				name,
				price: priceStr,
				category,
				description
			});
		}
		if (!category)
			return fail(400, {
				error: 'Category is required.',
				name,
				price: priceStr,
				category,
				description
			});
		if (!imageFile || imageFile.size === 0) {
			return fail(400, {
				error: 'Product image is required.',
				name,
				price: priceStr,
				category,
				description
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
		} catch { /* ignore */ }

		// ── Upload image to Supabase Storage ────────────────────
		// Use a unique filename to avoid collisions
		const ext = imageFile.name.split('.').pop() ?? 'jpg';
		const fileName = `${slug}-${Date.now()}.${ext}`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from('product-images')
			.upload(fileName, imageFile, {
				contentType: imageFile.type,
				upsert: false
			});

		if (uploadError) {
			console.error('Image upload failed:', uploadError.message);
			return fail(500, {
				error: 'Failed to upload image. Please try again.',
				name,
				price: priceStr,
				category,
				description
			});
		}

		// Get the public URL for the uploaded image
		const { data: urlData } = supabaseAdmin.storage.from('product-images').getPublicUrl(fileName);

		const imageUrl = urlData.publicUrl;

		// ── Insert the product row ──────────────────────────────
		const { error: insertError } = await supabaseAdmin.from('products').insert(
			/** @type {any} */({
				name,
				slug,
				description,
				price,
				category,
				image_url: imageUrl,
				in_stock: true,
				dimensions,
				colors
			})
		);

		if (insertError) {
			console.error('Product insert failed:', insertError.message);

			// Clean up the uploaded image on failure
			await supabaseAdmin.storage.from('product-images').remove([fileName]);

			// Handle unique slug collision
			if (insertError.code === '23505') {
				return fail(409, {
					error: 'A product with this name already exists. Use a different name.',
					name,
					price: priceStr,
					category,
					description
				});
			}

			return fail(500, {
				error: 'Failed to save product. Please try again.',
				name,
				price: priceStr,
				category,
				description
			});
		}

		throw redirect(303, '/admin');
	}
};
