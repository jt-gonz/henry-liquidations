import { percentChange } from '$lib/server/reportStats.js';

const COLORS = {
	dark: '#2b2420',
	mid: '#857a6e',
	brown: '#bf5730',
	light: '#e4dccf',
	bg: '#faf6ef',
	white: '#ffffff',
	good: '#2f6e62',
	bad: '#bf5730'
};

/** @param {number} n */
const money = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** @param {number} n */
const count = (n) => Number(n).toLocaleString('en-US');

/**
 * @param {number} current
 * @param {number} prev
 */
function deltaBadge(current, prev) {
	const pct = percentChange(current, prev);
	if (pct === null) return `<span style="color:${COLORS.mid};font-size:13px;">new this period</span>`;
	const sign = pct >= 0 ? '+' : '';
	const color = pct >= 0 ? COLORS.good : COLORS.bad;
	return `<span style="color:${color};font-size:13px;font-weight:600;">${sign}${pct.toFixed(0)}% vs. prior period</span>`;
}

/**
 * For a rate that's already a percentage (e.g. conversion), a relative
 * percent-change reads as alarming for small numbers — going from
 * 0.25% to 0.5% is technically "+100%" but that's not what a business
 * owner means by "up 100%". Show the percentage-point difference instead.
 * @param {number} current
 * @param {number} prev
 */
function deltaBadgePoints(current, prev) {
	const diff = current - prev;
	const sign = diff >= 0 ? '+' : '';
	const color = diff >= 0 ? COLORS.good : COLORS.bad;
	return `<span style="color:${color};font-size:13px;font-weight:600;">${sign}${diff.toFixed(2)} pts vs. prior period</span>`;
}

/** @param {any[]} rows @param {string} labelKey @param {string} valueKey @param {(n: number) => string} [formatValue] */
function rankedList(rows, labelKey, valueKey, formatValue = count) {
	if (!rows || rows.length === 0) {
		return `<p style="margin:0;color:${COLORS.mid};font-size:14px;">None this period.</p>`;
	}
	const items = rows
		.map(
			(/** @type {any} */ r, i) =>
				`<tr>
					<td style="padding:6px 0;color:${COLORS.mid};font-size:13px;width:24px;">${i + 1}.</td>
					<td style="padding:6px 0;color:${COLORS.dark};font-size:14px;">${escapeHtml(String(r[labelKey]))}</td>
					<td style="padding:6px 0;color:${COLORS.mid};font-size:14px;text-align:right;font-variant-numeric:tabular-nums;">${formatValue(r[valueKey])}</td>
				</tr>`
		)
		.join('');
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tbody>${items}</tbody></table>`;
}

/** @param {string} s */
function escapeHtml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * @param {string} label
 * @param {string} value
 * @param {string} deltaHtml
 */
function statCell(label, value, deltaHtml) {
	return `
		<td style="padding:18px 20px;background:${COLORS.white};border:1px solid ${COLORS.light};border-radius:10px;" width="33%">
			<div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.mid};font-weight:600;">${label}</div>
			<div style="font-size:26px;font-weight:700;color:${COLORS.dark};margin-top:6px;line-height:1.1;">${value}</div>
			<div style="margin-top:4px;">${deltaHtml}</div>
		</td>`;
}

/**
 * Renders the full HTML email for one owner report. Table-based layout
 * with inline styles throughout — email clients (Outlook especially)
 * don't reliably support external/flex CSS.
 *
 * @param {{
 *   siteName: string,
 *   kind: string,
 *   label: string,
 *   metrics: import('$lib/server/reportStats.js').ReportMetrics
 * }} params
 */
export function renderReportEmail({ siteName, kind, label, metrics }) {
	const { traffic, orders, search } = metrics;
	const conversionRate = traffic.uniqueVisitors > 0 ? (orders.orderCount / traffic.uniqueVisitors) * 100 : 0;
	const conversionRatePrev =
		traffic.uniqueVisitorsPrev > 0 ? (orders.orderCountPrev / traffic.uniqueVisitorsPrev) * 100 : 0;

	const zeroResultSection =
		search.topZeroResultSearches.length > 0
			? `
		<tr><td style="padding:28px 0 0 0;">
			<div style="font-size:15px;font-weight:700;color:${COLORS.dark};margin-bottom:4px;">Shoppers searched for this and found nothing</div>
			<p style="margin:0 0 10px 0;color:${COLORS.mid};font-size:13px;">The clearest signal for what the catalog or copy is missing.</p>
			${rankedList(search.topZeroResultSearches, 'term', 'count')}
		</td></tr>`
			: '';

	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

<tr><td style="padding-bottom:24px;">
	<div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.brown};font-weight:700;">${kind} Report</div>
	<div style="font-size:22px;font-weight:700;color:${COLORS.dark};margin-top:4px;">${siteName}</div>
	<div style="font-size:14px;color:${COLORS.mid};margin-top:2px;">${label}</div>
</td></tr>

<tr><td>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
		${statCell('Revenue', money(orders.revenue), deltaBadge(orders.revenue, orders.revenuePrev))}
		<td width="12"></td>
		${statCell('Orders', count(orders.orderCount), deltaBadge(orders.orderCount, orders.orderCountPrev))}
		<td width="12"></td>
		${statCell('Avg. order', money(orders.avgOrderValue), '&nbsp;')}
	</tr></table>
</td></tr>

<tr><td style="padding-top:12px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
		${statCell('Visitors', count(traffic.uniqueVisitors), deltaBadge(traffic.uniqueVisitors, traffic.uniqueVisitorsPrev))}
		<td width="12"></td>
		${statCell('Page views', count(traffic.pageViews), deltaBadge(traffic.pageViews, traffic.pageViewsPrev))}
		<td width="12"></td>
		${statCell('Conversion', `${conversionRate.toFixed(2)}%`, deltaBadgePoints(conversionRate, conversionRatePrev))}
	</tr></table>
</td></tr>

<tr><td style="padding:28px 0 0 0;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
		<td width="50%" valign="top" style="padding-right:16px;">
			<div style="font-size:15px;font-weight:700;color:${COLORS.dark};margin-bottom:10px;">Best sellers</div>
			${rankedList(orders.topProducts, 'name', 'quantity', (n) => `${count(n)} sold`)}
		</td>
		<td width="50%" valign="top" style="padding-left:16px;border-left:1px solid ${COLORS.light};">
			<div style="font-size:15px;font-weight:700;color:${COLORS.dark};margin-bottom:10px;">Most-visited pages</div>
			${rankedList(traffic.topPages, 'path', 'count')}
		</td>
	</tr></table>
</td></tr>

${zeroResultSection}

<tr><td style="padding-top:36px;border-top:1px solid ${COLORS.light};margin-top:28px;">
	<p style="margin:16px 0 0 0;color:${COLORS.mid};font-size:12px;">
		Automated report for ${siteName}. Covers ${label}, compared against the prior ${kind.toLowerCase().replace('ly', '')}.
	</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
