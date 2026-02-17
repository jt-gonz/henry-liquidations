import { redirect } from '@sveltejs/kit';

/**
 * Admin layout server load — ensures user is authenticated.
 * The hooks.server.js already redirects unauthenticated users,
 * but this provides the user object to the admin layout/pages.
 *
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		user: {
			email: locals.user.email ?? ''
		}
	};
}
