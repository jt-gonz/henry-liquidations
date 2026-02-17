import { fail } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';

/**
 * Load all quotes.
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
    const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to load quotes:', error.message);
    }

    return { quotes: quotes ?? [] };
}

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
    addQuote: async ({ request }) => {
        const form = await request.formData();
        const quote = form.get('quote')?.toString()?.trim() ?? '';
        const reviewer = form.get('reviewer')?.toString()?.trim() ?? '';

        if (!quote) return fail(400, { quoteError: 'Quote text is required.' });
        if (!reviewer) return fail(400, { quoteError: 'Reviewer name is required.' });

        const { error } = await supabaseAdmin
            .from('quotes')
            .insert(/** @type {any} */({ quote, reviewer }));

        if (error) {
            console.error('Failed to add quote:', error.message);
            return fail(500, { quoteError: 'Failed to add quote.' });
        }

        return { quoteAdded: true };
    },

    deleteQuote: async ({ request }) => {
        const form = await request.formData();
        const id = form.get('id')?.toString();

        if (!id) return fail(400, { quoteError: 'Quote ID is required.' });

        const { error } = await supabaseAdmin.from('quotes').delete().eq('id', id);

        if (error) {
            console.error('Failed to delete quote:', error.message);
            return fail(500, { quoteError: 'Failed to delete quote.' });
        }

        return { quoteDeleted: true };
    }
};
