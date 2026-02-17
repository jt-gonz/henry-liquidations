import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** Cookie options — secure only in production */
const cookieOpts = {
	path: '/',
	httpOnly: true,
	sameSite: /** @type {const} */ ('lax'),
	secure: !dev,
	maxAge: 60 * 60 * 24 * 7 // 7 days
};

/**
 * If the user is already logged in, redirect straight to /admin.
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export function load({ locals }) {
	if (locals.user) {
		throw redirect(303, '/admin');
	}
}

/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	/**
	 * Named action — sign in with email + password.
	 */
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString() ?? '';
		const password = form.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { error: 'Invalid email or password.', email });
		}

		// Persist session tokens in httpOnly cookies
		cookies.set('sb-access-token', data.session.access_token, cookieOpts);
		cookies.set('sb-refresh-token', data.session.refresh_token, cookieOpts);

		throw redirect(303, '/admin');
	},

	/**
	 * Named action — sign out (called from admin sidebar).
	 * Usage: <form method="POST" action="/login?/logout">
	 */
	logout: async ({ cookies }) => {
		cookies.delete('sb-access-token', { path: '/' });
		cookies.delete('sb-refresh-token', { path: '/' });
		throw redirect(303, '/login');
	}
};
