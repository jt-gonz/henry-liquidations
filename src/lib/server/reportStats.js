import { supabaseAdmin } from '$lib/server/supabase.js';
import { getPeriodBounds, toISODate } from '$lib/server/reportPeriods.js';

/**
 * Fetches the owner-report metrics for one period, via the
 * get_report_stats() Postgres RPC (see
 * supabase/migrations/017_report_stats_rpc.sql) so correctness never
 * depends on how large page_views/orders/search_queries have grown.
 *
 * @param {'week' | 'month' | 'quarter'} periodType
 * @param {Date} [now]
 */
export async function getReportStats(periodType, now = new Date()) {
	const bounds = getPeriodBounds(periodType, now);

	const { data, error } = await /** @type {any} */ (supabaseAdmin).rpc('get_report_stats', {
		period_start: toISODate(bounds.start),
		period_end: toISODate(bounds.end),
		prev_period_start: toISODate(bounds.prevStart),
		prev_period_end: toISODate(bounds.prevEnd)
	});

	if (error) {
		throw new Error(`get_report_stats failed: ${error.message}`);
	}

	return { bounds, metrics: /** @type {ReportMetrics} */ (data) };
}

/**
 * @typedef {Object} ReportMetrics
 * @property {{ pageViews: number, pageViewsPrev: number, uniqueVisitors: number, uniqueVisitorsPrev: number, topPages: {path: string, count: number}[] }} traffic
 * @property {{ revenue: number, revenuePrev: number, orderCount: number, orderCountPrev: number, avgOrderValue: number, topProducts: {name: string, quantity: number, revenue: number}[] }} orders
 * @property {{ totalSearches: number, zeroResultCount: number, topSearches: {term: string, count: number}[], topZeroResultSearches: {term: string, count: number}[] }} search
 */

/**
 * Percent change from `prev` to `current`, or null when there's no
 * meaningful baseline (prev was 0) — callers should render "new" or
 * omit the comparison rather than show a nonsensical "+Infinity%".
 * @param {number} current
 * @param {number} prev
 */
export function percentChange(current, prev) {
	if (prev === 0) return current === 0 ? 0 : null;
	return ((current - prev) / prev) * 100;
}
