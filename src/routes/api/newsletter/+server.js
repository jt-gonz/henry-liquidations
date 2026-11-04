import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter
 *
 * Expected body: { email: string, source?: string }
 * Idempotent — resignup with the same email is treated as success, not
 * an error.
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

	const email = body?.email?.toString().trim().toLowerCase();
	const source = body?.source?.toString().slice(0, 100) || null;

	if (!email || !EMAIL_RE.test(email)) {
		return json({ error: 'Please enter a valid email address.' }, { status: 400 });
	}

	const { error } = await /** @type {any} */ (supabaseAdmin)
		.from('newsletter_subscribers')
		.insert({ email, source });

	if (error && error.code !== '23505') {
		console.error('Failed to save newsletter signup:', error.message);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}

	return json({ success: true });
}
