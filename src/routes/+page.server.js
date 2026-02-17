import { supabase } from '$lib/server/supabase.js';

/**
 * Load quotes for the home page testimonials section.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
    const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error('Failed to load quotes:', error.message);
        return { quotes: [] };
    }

    return { quotes: quotes ?? [] };
}
