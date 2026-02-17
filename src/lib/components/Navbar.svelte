<script>
	import { cart } from '$lib/stores/cart.js';
	import { page } from '$app/stores';

	/** @type {{ class?: string }} */
	let { class: className = '' } = $props();

	let itemCount = $derived($cart.reduce((sum, item) => sum + item.quantity, 0));

	function isActive(path) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}
</script>

<nav class="sticky top-0 z-[100] border-b border-gray-200 bg-white/95 backdrop-blur-sm {className}">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-3">
			<img src="/logo.png.avif" alt="Henry's Liquidation Store" class="h-12 w-auto" />
			<span class="text-2xl font-bold tracking-tight text-gray-900 hidden sm:block">Henry's Liquidation</span>
		</a>
		<div class="flex items-center gap-8">
			<a
				href="/"
				class="text-base font-medium transition-colors {isActive('/') ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'}"
			>
				Home
			</a>
			<a
				href="/shop"
				class="text-base font-medium transition-colors {isActive('/shop') ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'}"
			>
				Shop
			</a>
			<a
				href="/cart"
				class="relative group flex items-center gap-2 text-base font-medium transition-colors {isActive('/cart') ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'}"
			>
				<span>Cart</span>
				{#if itemCount > 0}
					<span
						class="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white transition-transform group-hover:scale-110"
					>
						{itemCount > 9 ? '9+' : itemCount}
					</span>
				{/if}
			</a>
		</div>
	</div>
</nav>
