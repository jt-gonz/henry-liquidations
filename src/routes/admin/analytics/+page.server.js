import { getDashboardStats } from '$lib/server/analyticsStats.js';

/**
 * Load traffic + customer behavior stats for the admin analytics dashboard.
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export async function load() {
	const stats = await getDashboardStats();
	return { stats };
}
