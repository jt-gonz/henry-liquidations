/**
 * Date-range math for the automated owner report. Each period is a
 * half-open range [start, end) ending at the most recent boundary
 * before `now` — e.g. a "week" report run on any Monday covers the
 * Monday-through-Sunday that just finished. Correctness depends on the
 * cron schedule actually firing on those boundaries (see vercel.json):
 * weekly on Mondays, monthly on the 1st, quarterly on Jan/Apr/Jul/Oct 1st.
 */

/** @param {Date} date */
function startOfUTCDay(date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** @param {Date} date @param {number} days */
function addDays(date, days) {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** @param {Date} date @param {number} months */
function addMonths(date, months) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

const MONTH_NAMES = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/** @param {Date} date */
function formatDate(date) {
	return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/**
 * @param {'week' | 'month' | 'quarter'} periodType
 * @param {Date} [now]
 */
export function getPeriodBounds(periodType, now = new Date()) {
	const today = startOfUTCDay(now);

	if (periodType === 'week') {
		const end = today;
		const start = addDays(end, -7);
		const prevEnd = start;
		const prevStart = addDays(prevEnd, -7);
		return {
			start,
			end,
			prevStart,
			prevEnd,
			label: `${formatDate(start)} – ${formatDate(addDays(end, -1))}`,
			kind: 'Weekly'
		};
	}

	if (periodType === 'month') {
		const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
		const start = addMonths(end, -1);
		const prevEnd = start;
		const prevStart = addMonths(prevEnd, -1);
		return {
			start,
			end,
			prevStart,
			prevEnd,
			label: `${MONTH_NAMES[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
			kind: 'Monthly'
		};
	}

	// quarter
	const currentQuarterStartMonth = Math.floor(today.getUTCMonth() / 3) * 3;
	const end = new Date(Date.UTC(today.getUTCFullYear(), currentQuarterStartMonth, 1));
	const start = addMonths(end, -3);
	const prevEnd = start;
	const prevStart = addMonths(prevEnd, -3);
	const quarterNum = Math.floor(start.getUTCMonth() / 3) + 1;
	return {
		start,
		end,
		prevStart,
		prevEnd,
		label: `Q${quarterNum} ${start.getUTCFullYear()}`,
		kind: 'Quarterly'
	};
}

/** @param {Date} date */
export function toISODate(date) {
	return date.toISOString().slice(0, 10);
}
