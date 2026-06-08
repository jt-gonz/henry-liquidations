/**
 * Server-side analytics tracking utility
 * This helps track important admin actions that occur on the server
 */

/**
 * Log admin action for analytics purposes
 * In production, these would be sent to your analytics service
 * @param {string} event - The event name
 * @param {Record<string, any>} properties - Event properties
 */
export function trackServerEvent(event, properties = {}) {
	// For now, just log to console
	// In production, you would send this to Vercel Analytics API or another service
	console.log('[Analytics]', event, properties);
}
