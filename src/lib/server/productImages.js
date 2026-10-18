/**
 * Whether a product's first image is likely to actually load. A handful of
 * products have filenames with unencoded commas/spaces that fail to load in
 * the browser — this can't be known for certain without fetching the URL,
 * but it's a cheap, effective heuristic for de-prioritizing the known cases.
 * @param {any} product
 */
export function hasReliableImage(product) {
	const url = product.image_url?.[0];
	if (!url) return false;
	try {
		const filename = decodeURIComponent(url.split('/').pop() ?? '');
		return !/[,\s]/.test(filename);
	} catch {
		return false;
	}
}

/**
 * Sort products with a reliable image first (stable — preserves the
 * original ordering within each group), then take the first `limit`.
 * @param {any[]} products
 * @param {number} limit
 */
export function prioritizeImages(products, limit) {
	return [...products]
		.sort((a, b) => Number(hasReliableImage(b)) - Number(hasReliableImage(a)))
		.slice(0, limit);
}
