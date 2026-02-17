<script>
	import { cart } from '$lib/stores/cart.js';
	import { page } from '$app/stores';

	/** @type {{ class?: string }} */
	let { class: className = '' } = $props();

	let itemCount = $derived($cart.reduce((sum, item) => sum + item.quantity, 0));

	/**
	 * @param {string} path
	 */
	function isActive(path) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}
</script>

<nav class="sticky top-0 z-[100] border-b border-brand-mid bg-brand-brown shadow-lg {className}">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-3">
			<img
				src="/logo.png.avif"
				alt="Henry's Liquidation Store"
				class="h-12 w-auto drop-shadow-md"
			/>
			<span class="hidden text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:block"
				>Henry's Liquidation</span
			>
		</a>
		<div class="flex items-center gap-8">
			<a
				href="/"
				class="text-base font-medium text-white/90 transition-all duration-200 hover:scale-105 hover:text-white {isActive(
					'/'
				)
					? 'border-b-2 border-white text-white drop-shadow-sm'
					: ''}"
			>
				Home
			</a>
			<a
				href="/shop"
				class="text-base font-medium text-white/90 transition-all duration-200 hover:scale-105 hover:text-white {isActive(
					'/shop'
				)
					? 'border-b-2 border-white text-white drop-shadow-sm'
					: ''}"
			>
				Shop
			</a>
			<a
				href="/cart"
				class="group relative flex items-center gap-2 text-base font-medium text-white/90 transition-all duration-200 hover:scale-105 hover:text-white {isActive(
					'/cart'
				)
					? 'border-b-2 border-white text-white drop-shadow-sm'
					: ''}"
			>
				<span>Cart</span>
				{#if itemCount > 0}
					<span
						class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-brown shadow-md transition-transform group-hover:scale-110"
					>
						{itemCount > 9 ? '9+' : itemCount}
					</span>
				{/if}
			</a>
		</div>
	</div>
</nav>
