import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { supabaseAdmin } from '$lib/server/supabase.js';

/** Cookie options — secure only in production (HTTP in dev won't send Secure cookies) */
const cookieOpts = {
	path: '/',
	httpOnly: true,
	sameSite: /** @type {const} */ ('lax'),
	secure: !dev,
	maxAge: 60 * 60 * 24 * 7 // 7 days
};

/** Cookie options for the anonymous analytics visitor id — long-lived, no PII. */
const visitorCookieOpts = {
	path: '/',
	httpOnly: true,
	sameSite: /** @type {const} */ ('lax'),
	secure: !dev,
	maxAge: 60 * 60 * 24 * 365 // 1 year
};

/**
 * Whether a request represents a real page view worth counting toward
 * traffic stats (skips admin, API, auth, and static asset requests).
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function isTrackablePageView(event) {
	if (event.request.method !== 'GET') return false;
	const { pathname } = event.url;
	if (pathname.startsWith('/admin')) return false;
	if (pathname.startsWith('/api')) return false;
	if (pathname.startsWith('/_app')) return false;
	if (pathname === '/login') return false;
	// Skip static assets (favicon.ico, robots.txt, *.js, *.css, *.png, ...)
	if (/\.[a-zA-Z0-9]+$/.test(pathname)) return false;
	return true;
}

/**
 * Get the anonymous visitor id from cookies, generating and storing a new
 * one on first visit. Not tied to any account — purely for de-duplicating
 * traffic counts (e.g. unique visitors).
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function getOrSetVisitorId(event) {
	let visitorId = event.cookies.get('vid');
	if (!visitorId) {
		visitorId = crypto.randomUUID();
		event.cookies.set('vid', visitorId, visitorCookieOpts);
	}
	return visitorId;
}

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

	// ── 3. Track page view for the admin analytics dashboard ───────
	// Best-effort: never let a tracking failure break the page.
	if (isTrackablePageView(event)) {
		try {
			const visitorId = getOrSetVisitorId(event);
			const { error: trackError } = await supabaseAdmin.from('page_views').insert(
				/** @type {any} */ ({
					path: event.url.pathname,
					visitor_id: visitorId,
					referrer: event.request.headers.get('referer')?.slice(0, 500) ?? null
				})
			);
			if (trackError) {
				console.error('Failed to record page view:', trackError.message);
			}
		} catch (err) {
			console.error('Failed to record page view:', err);
		}
	}

	return resolve(event);
}
