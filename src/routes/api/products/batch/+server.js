import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase.js';
import { withComputedStock } from '$lib/server/stock.js';

/**
 * POST /api/products/batch
 *
 * Fetches details for a list of product IDs.
 * Expected body: { ids: string[] }
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
        return json({ products: [] });
    }

    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, in_stock, image_url, slug, stock_quantity, bundle_component_ids')
        .in('id', ids);

    if (error) {
        console.error('Batch product fetch error:', error.message);
        return json({ error: 'Failed to fetch products.' }, { status: 500 });
    }

    const products = await withComputedStock(supabase, data ?? []);

    return json({ products });
}
