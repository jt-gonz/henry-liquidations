/**
 * Color Names Configuration
 *
 * Maps hex color codes to human-readable names
 * Add new colors here following the format:
 * '#HEXCODE': 'Color Name'
 */

/**
 * @typedef {Object} ColorInfo
 * @property {string} hex - The hex color code
 * @property {string} name - The human-readable color name
 */

/** @type {Record<string, string>} */
export const COLOR_NAMES = {
	// Grays
	'#000000': 'Black',
	'#333333': 'Dark Gray',
	'#666666': 'Medium Gray',
	'#808080': 'Gray',
	'#999999': 'Light Gray',
	'#C0C0C0': 'Silver',
	'#D3D3D3': 'Light Gray',
	'#DCDCDC': 'Gainsboro',
	'#E5E7EB': 'Light Gray',
	'#F5F5F5': 'White Smoke',
	'#F5F5DC': 'Beige',
	'#FFFFFF': 'White',

	// Browns
	'#373D20': 'Olive Drab',

	'#766153': 'Taupe',
	'#BCBD8B': 'Sage',
	'#8B4513': 'Saddle Brown',
	'#A0522D': 'Sienna',
	'#CD853F': 'Peru',
	'#D2691E': 'Chocolate',
	'#DEB887': 'Burlywood',
	'#F4A460': 'Sandy Brown',
	'#D2B48C': 'Tan',
	'#C19A6B': 'Camel',
	'#966F33': 'Golden Brown',

	// Reds
	'#800000': 'Maroon',
	'#8B0000': 'Dark Red',
	'#A52A2A': 'Brown',
	'#B22222': 'Fire Brick',
	'#DC143C': 'Crimson',
	'#FF0000': 'Red',
	'#FF4500': 'Orange Red',
	'#FF6347': 'Tomato',
	'#FF7F50': 'Coral',

	// Oranges
	'#FF8C00': 'Dark Orange',
	'#FFA500': 'Orange',
	'#FFB347': 'Light Orange',
	'#FFCC99': 'Peach',

	// Yellows
	'#FFD700': 'Gold',
	'#FFFF00': 'Yellow',
	'#FFFFE0': 'Light Yellow',
	'#FFFACD': 'Lemon Chiffon',
	'#FAFAD2': 'Light Goldenrod',

	// Greens
	'#006400': 'Dark Green',
	'#228B22': 'Forest Green',
	'#008000': 'Green',
	'#2E8B57': 'Sea Green',
	'#3CB371': 'Medium Sea Green',
	'#90EE90': 'Light Green',
	'#98FB98': 'Pale Green',
	'#00FF00': 'Lime',
	'#32CD32': 'Lime Green',
	'#9ACD32': 'Yellow Green',
	'#6B8E23': 'Olive Drab',
	'#808000': 'Olive',

	// Blues
	'#000080': 'Navy',
	'#00008B': 'Dark Blue',
	'#0000CD': 'Medium Blue',
	'#0000FF': 'Blue',
	'#4169E1': 'Royal Blue',
	'#1E90FF': 'Dodger Blue',
	'#00BFFF': 'Deep Sky Blue',
	'#87CEEB': 'Sky Blue',
	'#87CEFA': 'Light Sky Blue',
	'#ADD8E6': 'Light Blue',
	'#B0C4DE': 'Light Steel Blue',
	'#B0E0E6': 'Powder Blue',

	// Purples
	'#4B0082': 'Indigo',
	'#483D8B': 'Dark Slate Blue',
	'#6A5ACD': 'Slate Blue',
	'#7B68EE': 'Medium Slate Blue',
	'#9370DB': 'Medium Purple',
	'#8A2BE2': 'Blue Violet',
	'#9400D3': 'Dark Violet',
	'#9932CC': 'Dark Orchid',
	'#BA55D3': 'Medium Orchid',
	'#DA70D6': 'Orchid',
	'#EE82EE': 'Violet',
	'#DDA0DD': 'Plum',

	// Pinks
	'#FFC0CB': 'Pink',
	'#FFB6C1': 'Light Pink',
	'#FF69B4': 'Hot Pink',
	'#FF1493': 'Deep Pink',
	'#DB7093': 'Pale Violet Red',
	'#C71585': 'Medium Violet Red',

	// Misc
	'#FFE4E1': 'Misty Rose',
	'#FFE4B5': 'Moccasin',
	'#FFDEAD': 'Navajo White',
	'#F5DEB3': 'Wheat',
	'#FFE4C4': 'Bisque',
	'#FFEBCD': 'Blanched Almond',
	'#FAEBD7': 'Antique White',
	'#FFEFD5': 'Papaya Whip'

	// Henry's Brand Colors (using existing color names)
};

/**
 * Get the human-readable name for a color
 * @param {string} hex - The hex color code (e.g., "#717744")
 * @returns {string} The color name, or the hex code if not found
 */
export function getColorName(hex) {
	if (!hex) return '';
	// Normalize hex to uppercase for lookup
	const normalized = hex.toUpperCase();
	return COLOR_NAMES[normalized] || hex;
}

/**
 * Get a display-friendly color label
 * @param {string} hex - The hex color code
 * @returns {string} Name with hex in parentheses, or just hex if no name
 */
export function getColorLabel(hex) {
	const name = getColorName(hex);
	if (name === hex) {
		return hex; // No name found, just return hex
	}
	return name;
}
