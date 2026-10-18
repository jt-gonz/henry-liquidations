/**
 * URL-safe slug from free text (product name, category label, ...).
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
