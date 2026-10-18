/**
 * Lightweight bot/crawler detection for first-party page-view tracking.
 * Not exhaustive (no UA database) — just filters the common, high-volume
 * automated clients (search crawlers, link-preview unfurlers, uptime
 * monitors, generic HTTP libraries) that otherwise show up as "visitors"
 * in page_views even though they never execute JS (so Vercel's client-side
 * analytics beacon never counts them), skewing our numbers far above
 * real traffic.
 */
const BOT_SUBSTRINGS = [
	'bot',
	'crawl',
	'spider',
	'slurp',
	'googlebot',
	'bingpreview',
	'facebookexternalhit',
	'ahrefsbot',
	'semrushbot',
	'mj12bot',
	'petalbot',
	'yandexbot',
	'baiduspider',
	'duckduckbot',
	'headlesschrome',
	'python-requests',
	'curl/',
	'wget/',
	'go-http-client',
	'scrapy'
];

/**
 * @param {string} userAgent
 */
export function isBotUserAgent(userAgent) {
	if (!userAgent) return true;
	const ua = userAgent.toLowerCase();
	return BOT_SUBSTRINGS.some((needle) => ua.includes(needle));
}
