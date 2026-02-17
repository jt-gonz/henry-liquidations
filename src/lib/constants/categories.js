/**
 * Product Categories Configuration
 *
 * Add new categories here following the format:
 * { value: 'UPPER_CASE_VALUE', label: 'Display Label' }
 *
 * The 'value' must match the category names in your CSV/database exactly.
 * The 'label' is what users will see in the UI.
 */

/**
 * @typedef {Object} Category
 * @property {string} value - The database value (must match CSV exactly)
 * @property {string} label - The display label shown to users
 */

/** @type {Category[]} */
export const CATEGORIES = [
	{ value: 'LIVING ROOM COLLECTION', label: 'Living Room Collection' },
	{ value: 'RECLINER COLLECTION', label: 'Recliner Collection' },
	{ value: 'ACCENTS COLLECTION', label: 'Accents Collection' },
	{ value: 'OCCASIONAL COLLECTION', label: 'Occasional Collection' },
	{ value: 'ACCESSORIES COLLECTION', label: 'Accessories Collection' }
];

/**
 * Get display label for a category value
 * @param {string} value - The category value from database
 * @returns {string} The display label, or the value itself if not found
 */
export function getCategoryLabel(value) {
	const category = CATEGORIES.find((cat) => cat.value === value);
	return category?.label || value;
}

/**
 * Get all category values (for database queries)
 * @returns {string[]} Array of category values
 */
export function getCategoryValues() {
	return CATEGORIES.map((cat) => cat.value);
}
