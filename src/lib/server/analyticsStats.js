import { supabaseAdmin } from '$lib/server/supabase.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build an ordered map of the last `days` date keys (oldest first, YYYY-MM-DD),
 * each initialized to 0 so charts always have a full, gap-free range.
 * @param {number} days
 */
function buildDailyBuckets(days) {
	/** @type {Map<string, number>} */
	const buckets = new Map();
	for (let i = days - 1; i >= 0; i--) {
		const key = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
		buckets.set(key, 0);
	}
	return buckets;
}

/**
 * Traffic stats derived from the first-party `page_views` table
 * (Vercel Web Analytics has no public read API, so we track this ourselves).
 *
 * Aggregated entirely in Postgres via the get_traffic_stats() RPC (see
 * supabase/migrations/007_page_view_stats_rpc.sql) rather than pulling raw
 * rows into JS — PostgREST silently caps unbounded selects at 1000 rows,
 * which used to make this table's growth corrupt both the "last 7 days"
 * KPI and the daily chart (see migration comment for the full story).
 */
export async function getTrafficStats() {
	const dailyBuckets = buildDailyBuckets(14);
	const fallback = {
		pageViews30d: 0,
		pageViews7d: 0,
		uniqueVisitors30d: 0,
		uniqueVisitors7d: 0,
		topPages: [],
		dailyViews: [...dailyBuckets.entries()].map(([date, count]) => ({ date, count }))
	};

	const { data, error } = await /** @type {any} */ (supabaseAdmin).rpc('get_traffic_stats', {
		days_back: 30,
		daily_days: 14
	});

	if (error) {
		console.error('Failed to load traffic stats:', error.message);
		return fallback;
	}

	return { ...fallback, .../** @type {object} */ (data) };
}

/**
 * Revenue / order stats derived from the real `orders` table
 * (populated by the Stripe webhook on successful checkout).
 *
 * Aggregated entirely in Postgres via the get_order_stats() RPC (see
 * supabase/migrations/010_order_stats_rpc.sql) rather than pulling raw
 * rows into JS — same fix already applied to getTrafficStats() for the
 * same PostgREST unbounded-select row cap issue.
 */
export async function getOrderStats() {
	const dailyBuckets = buildDailyBuckets(14);
	const fallback = {
		revenueAllTime: 0,
		revenue30d: 0,
		revenue7d: 0,
		ordersAllTime: 0,
		orders30d: 0,
		orders7d: 0,
		avgOrderValue30d: 0,
		topProducts: [],
		dailyRevenue: [...dailyBuckets.entries()].map(([date, total]) => ({ date, total }))
	};

	const { data, error } = await /** @type {any} */ (supabaseAdmin).rpc('get_order_stats', {
		days_back: 30,
		daily_days: 14
	});

	if (error) {
		console.error('Failed to load order stats:', error.message);
		return fallback;
	}

	return { ...fallback, .../** @type {object} */ (data) };
}

/**
 * Combined stats for the admin analytics dashboard.
 */
export async function getDashboardStats() {
	const [traffic, orders] = await Promise.all([getTrafficStats(), getOrderStats()]);

	const conversionRate30d =
		traffic.uniqueVisitors30d > 0 ? (orders.orders30d / traffic.uniqueVisitors30d) * 100 : 0;

	return { traffic, orders, conversionRate30d };
}
