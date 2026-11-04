/**
 * Returns a debounced wrapper around `fn` that only runs after `ms` have
 * passed since the last call.
 * @param {(...args: any[]) => void} fn
 * @param {number} ms
 */
export function debounce(fn, ms) {
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timeout;
	return (/** @type {any[]} */ ...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), ms);
	};
}
