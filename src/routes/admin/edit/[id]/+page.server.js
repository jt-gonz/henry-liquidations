import { fail, redirect, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';

export const load = async ({ params }) => {
    const { data: product, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

    if (fetchError || !product) {
        throw error(404, 'Product not found');
    }

    return { product };
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
        const imageFile = /** @type {File | null} */ (form.get('image'));

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
        } catch { /* ignore */ }

        /** @type {import('$lib/types/database.js').ProductUpdate} */
        const updates = {
            name,
            description,
            price: Number(price),
            category,
            dimensions,
            colors
        };

        // ── Handle Image Upload (Optional) ──────────────────────
        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop() ?? 'jpg';
            const fileName = `${slug}-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('product-images')
                .upload(fileName, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                });

            if (uploadError) {
                return fail(500, { error: 'Failed to upload new image.' });
            }

            const { data: urlData } = supabaseAdmin.storage.from('product-images').getPublicUrl(fileName);
            updates.image_url = urlData.publicUrl;
        }

        // ── Update Product ──────────────────────────────────────
        // ── Update Product in Database ──────────────────────────
        /** @type {any} */
        const finalUpdates = updates;

        const { error: updateError } = await supabaseAdmin
            .from('products')
            .update(finalUpdates)
            .eq('id', params.id);

        if (updateError) {
            return fail(500, { error: 'Failed to update product.' });
        }

        throw redirect(303, '/admin');
    }
};
