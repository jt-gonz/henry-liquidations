import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** Cookie options — secure only in production (HTTP in dev won't send Secure cookies) */
const cookieOpts = {
	path: '/',
	httpOnly: true,
	sameSite: /** @type {const} */ ('lax'),
	secure: !dev,
	maxAge: 60 * 60 * 24 * 7 // 7 days
};

/**
 * SvelteKit server hook — runs on every request.
 *
 * Responsibilities:
 * 1. Rehydrate the Supabase session from cookies so `event.locals.session`
 *    is available to all server load functions and form actions.
 * 2. Protect `/admin` routes — redirect to `/login` if not authenticated.
 *
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
	// ── 1. Rehydrate session from cookies ──────────────────────────
	const accessToken = event.cookies.get('sb-access-token');
	const refreshToken = event.cookies.get('sb-refresh-token');

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = null;

	if (accessToken && refreshToken) {
		// Create a per-request Supabase client so we can set the session
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

		const { data, error } = await supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		if (!error && data.session) {
			user = data.session.user;

			// If the tokens were refreshed, update the cookies
			if (data.session.access_token !== accessToken) {
				event.cookies.set('sb-access-token', data.session.access_token, cookieOpts);
				event.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOpts);
			}
		} else {
			// Invalid or expired session — clear stale cookies
			event.cookies.delete('sb-access-token', { path: '/' });
			event.cookies.delete('sb-refresh-token', { path: '/' });
		}
	}

	// Make the user available to all downstream load functions / actions
	event.locals.user = user;

	// ── 2. Protect /admin routes ───────────────────────────────────
	if (event.url.pathname.startsWith('/admin') && !user) {
		throw redirect(303, '/login');
	}

	return resolve(event);
}
