/**
 * Cart store — persisted to localStorage.
 *
 * Each item has the shape:
 *   { id: string, name: string, price: number, image_url: string, slug: string, quantity: number, color?: string }
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/** @typedef {{ id: string; name: string; price: number; image_url: string; slug: string; quantity: number; color?: string }} CartItem */

const STORAGE_KEY = 'cart';

/**
 * Load cart from localStorage (if available).
 * @returns {CartItem[]}
 */
function loadCart() {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

/** @type {import('svelte/store').Writable<CartItem[]>} */
export const cart = writable(loadCart());

// Persist every change to localStorage
if (browser) {
	cart.subscribe((items) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	});
}

/**
 * Generate a unique key for a cart item based on ID and color.
 * @param {string} id
 * @param {string} [color]
 */
function getItemKey(id, color) {
	return color ? `${id}-${color}` : id;
}

/**
 * Add a product to the cart (or increment quantity if already present).
 * @param {Omit<CartItem, 'quantity'>} product
 */
export function addToCart(product) {
	cart.update((items) => {
		const existing = items.find((i) => i.id === product.id && i.color === product.color);
		if (existing) {
			existing.quantity += 1;
			return [...items];
		}
		return [...items, { ...product, quantity: 1 }];
	});
}

/**
 * Remove an item entirely from the cart.
 * @param {string} id
 * @param {string} [color]
 */
export function removeFromCart(id, color) {
	cart.update((items) => items.filter((i) => !(i.id === id && i.color === color)));
}

/**
 * Set the quantity of a cart item. Removes the item if quantity <= 0.
 * @param {string} id
 * @param {number} quantity
 * @param {string} [color]
 */
export function updateQuantity(id, quantity, color) {
	if (quantity <= 0) {
		removeFromCart(id, color);
		return;
	}
	cart.update((items) => items.map((i) => (i.id === id && i.color === color ? { ...i, quantity } : i)));
}

/**
 * Clear the entire cart.
 */
export function clearCart() {
	cart.set([]);
}
