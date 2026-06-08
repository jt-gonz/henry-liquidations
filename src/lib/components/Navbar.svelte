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
			<div class="hidden items-center gap-6 md:flex">
				<a
					href="/"
					class="text-base font-medium text-white/90 transition-all duration-200 hover:text-white {isActive(
						'/'
					)
						? 'border-b-2 border-white text-white drop-shadow-sm'
						: ''}"
				>
					Home
				</a>
				<a
					href="/shop"
					class="rounded-full bg-brand-brown px-5 py-2 text-base font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-brand-brown/80 hover:shadow-lg {isActive(
						'/shop'
					)
						? 'ring-2 ring-white ring-offset-2 ring-offset-brand-brown-dark'
						: ''}"
				>
					Shop
				</a>
				<a
					href="/cart"
					class="group relative flex items-center gap-2 rounded-full bg-white px-4 py-2 text-brand-brown-dark shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-100 hover:shadow-lg {isActive(
						'/cart'
					)
						? 'ring-2 ring-white ring-offset-2 ring-offset-brand-brown-dark'
						: ''}"
					aria-label="Cart"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
					</svg>
					{#if itemCount > 0}
						<span
							class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-brown-dark text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-110"
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
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
						</svg>
						<span>Home</span>
					</div>
				</a>
				<a
					href="/shop"
					onclick={closeMobileMenu}
					class="mt-1 block rounded-md bg-brand-brown px-3 py-2 text-base font-bold text-white shadow-sm hover:bg-brand-brown/80 {isActive(
						'/shop'
					)
						? 'ring-2 ring-white ring-inset'
						: ''}"
				>
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75v-3.75a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
						</svg>
						<span>Shop</span>
					</div>
				</a>
				<a
					href="/cart"
					onclick={closeMobileMenu}
					class="mt-2 flex items-center justify-between rounded-md bg-white px-3 py-2 text-base font-bold text-brand-brown-dark shadow-sm hover:bg-gray-100 {isActive(
						'/cart'
					)
						? 'ring-2 ring-white ring-inset'
						: ''}"
				>
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
						</svg>
						<span>Cart</span>
					</div>
					{#if itemCount > 0}
						<span
							class="flex h-5 w-5 items-center justify-center rounded-full bg-brand-brown-dark text-xs font-bold text-white shadow-sm"
						>
							{itemCount > 9 ? '9+' : itemCount}
						</span>
					{/if}
				</a>
			</div>
		</div>
	{/if}
</nav>
