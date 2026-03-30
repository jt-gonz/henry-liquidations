<script>
	import { cart } from '$lib/stores/cart.js';
	import { page } from '$app/stores';

	/** @type {{ class?: string }} */
	let { class: className = '' } = $props();

	let itemCount = $derived($cart.reduce((sum, item) => sum + item.quantity, 0));
	let mobileMenuOpen = $state(false);
	let isAdminPage = $derived($page.url.pathname.startsWith('/admin'));

	/**
	 * @param {string} path
	 */
	function isActive(path) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<nav class="sticky top-0 z-[100] border-b border-brand-brown-dark/30 bg-brand-brown-dark shadow-lg {className}">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-3">
			<img
				src="/logo.png.avif"
				alt="Henry's Liquidation Store"
				class="h-10 w-auto drop-shadow-md sm:h-12"
			/>
			<span class="hidden text-xl font-bold tracking-tight text-white drop-shadow-sm sm:block sm:text-2xl"
				>Henry's Liquidation</span
			>
		</a>

		<!-- Mobile menu button -->
		{#if !isAdminPage}
			<button
				type="button"
				class="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-brand-brown/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset md:hidden"
				onclick={toggleMobileMenu}
				aria-expanded={mobileMenuOpen}
			>
				<span class="sr-only">Open main menu</span>
				{#if !mobileMenuOpen}
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{:else}
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{/if}
			</button>
		{/if}

		<!-- Desktop menu -->
		{#if !isAdminPage}
			<div class="hidden items-center gap-8 md:flex">
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
							class="flex h-5 w-5 items-center justify-center rounded-full bg-brand-brown text-[10px] font-bold text-white shadow-md transition-transform group-hover:scale-110"
						>
							{itemCount > 9 ? '9+' : itemCount}
						</span>
					{/if}
				</a>
			</div>
		{/if}
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen && !isAdminPage}
		<div class="border-t border-brand-brown/30 md:hidden">
			<div class="space-y-1 px-4 pb-3 pt-2">
				<a
					href="/"
					onclick={closeMobileMenu}
					class="block rounded-md px-3 py-2 text-base font-medium text-white/90 hover:bg-brand-brown/20 hover:text-white {isActive(
						'/'
					)
						? 'bg-brand-brown/30 text-white'
						: ''}"
				>
					Home
				</a>
				<a
					href="/shop"
					onclick={closeMobileMenu}
					class="block rounded-md px-3 py-2 text-base font-medium text-white/90 hover:bg-brand-brown/20 hover:text-white {isActive(
						'/shop'
					)
						? 'bg-brand-brown/30 text-white'
						: ''}"
				>
					Shop
				</a>
				<a
					href="/cart"
					onclick={closeMobileMenu}
					class="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-white/90 hover:bg-brand-brown/20 hover:text-white {isActive(
						'/cart'
					)
						? 'bg-brand-brown/30 text-white'
						: ''}"
				>
					<span>Cart</span>
					{#if itemCount > 0}
						<span
							class="flex h-5 w-5 items-center justify-center rounded-full bg-brand-brown text-xs font-bold text-white"
						>
							{itemCount > 9 ? '9+' : itemCount}
						</span>
					{/if}
				</a>
			</div>
		</div>
	{/if}
</nav>
