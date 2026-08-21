import { supabaseAdmin } from '$lib/server/supabase.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {number} days */
function daysAgoIso(days) {
	return new Date(Date.now() - days * DAY_MS).toISOString();
}

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
 */
export async function getTrafficStats() {
	const since30 = daysAgoIso(30);
	const since7 = daysAgoIso(7);

	const { data: rows, error } = await supabaseAdmin
		.from('page_views')
		.select('path, visitor_id, created_at')
		.gte('created_at', since30)
		.order('created_at', { ascending: true });

	const dailyBuckets = buildDailyBuckets(14);

	if (error) {
		console.error('Failed to load page views:', error.message);
		return {
			pageViews30d: 0,
			pageViews7d: 0,
			uniqueVisitors30d: 0,
			uniqueVisitors7d: 0,
			topPages: [],
			dailyViews: [...dailyBuckets.entries()].map(([date, count]) => ({ date, count }))
		};
	}

	const views = /** @type {{ path: string, visitor_id: string, created_at: string }[]} */ (
		rows ?? []
	);
	const views7d = views.filter((v) => v.created_at >= since7);

	/** @type {Map<string, number>} */
	const pageCounts = new Map();
	for (const v of views) {
		pageCounts.set(v.path, (pageCounts.get(v.path) ?? 0) + 1);
	}
	const topPages = [...pageCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([path, count]) => ({ path, count }));

	for (const v of views) {
		const key = v.created_at.slice(0, 10);
		if (dailyBuckets.has(key)) {
			dailyBuckets.set(key, /** @type {number} */ (dailyBuckets.get(key)) + 1);
		}
	}

	return {
		pageViews30d: views.length,
		pageViews7d: views7d.length,
		uniqueVisitors30d: new Set(views.map((v) => v.visitor_id)).size,
		uniqueVisitors7d: new Set(views7d.map((v) => v.visitor_id)).size,
		topPages,
		dailyViews: [...dailyBuckets.entries()].map(([date, count]) => ({ date, count }))
	};
}

/**
 * Revenue / order stats derived from the real `orders` table
 * (populated by the Stripe webhook on successful checkout).
 */
export async function getOrderStats() {
	const since30 = daysAgoIso(30);
	const since7 = daysAgoIso(7);

	const { data: rows, error } = await supabaseAdmin
		.from('orders')
		.select('items, created_at')
		.eq('payment_status', 'paid')
		.order('created_at', { ascending: true });

	const dailyBuckets = buildDailyBuckets(14);

	if (error) {
		console.error('Failed to load orders:', error.message);
		return {
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
	}

	/** @typedef {{ product_id: string, name: string, price: number, quantity: number }} OrderItem */
	const orders = /** @type {{ items: OrderItem[], created_at: string }[]} */ (rows ?? []).map(
		(o) => ({
			...o,
			total: (o.items ?? []).reduce(
				(sum, item) => sum + Number(item.price) * Number(item.quantity),
				0
			)
		})
	);

	const orders30d = orders.filter((o) => o.created_at >= since30);
	const orders7d = orders.filter((o) => o.created_at >= since7);

	const revenueAllTime = orders.reduce((sum, o) => sum + o.total, 0);
	const revenue30d = orders30d.reduce((sum, o) => sum + o.total, 0);
	const revenue7d = orders7d.reduce((sum, o) => sum + o.total, 0);

	/** @type {Map<string, { name: string, quantity: number, revenue: number }>} */
	const productTotals = new Map();
	for (const o of orders30d) {
		for (const item of o.items ?? []) {
			const key = item.product_id ?? item.name;
			const existing = productTotals.get(key) ?? { name: item.name, quantity: 0, revenue: 0 };
			existing.quantity += Number(item.quantity);
			existing.revenue += Number(item.price) * Number(item.quantity);
			productTotals.set(key, existing);
		}
	}
	const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

	for (const o of orders) {
		const key = o.created_at.slice(0, 10);
		if (dailyBuckets.has(key)) {
			dailyBuckets.set(key, /** @type {number} */ (dailyBuckets.get(key)) + o.total);
		}
	}

	return {
		revenueAllTime,
		revenue30d,
		revenue7d,
		ordersAllTime: orders.length,
		orders30d: orders30d.length,
		orders7d: orders7d.length,
		avgOrderValue30d: orders30d.length > 0 ? revenue30d / orders30d.length : 0,
		topProducts,
		dailyRevenue: [...dailyBuckets.entries()].map(([date, total]) => ({ date, total }))
	};
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
