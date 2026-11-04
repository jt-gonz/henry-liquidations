<script>
	import { cart } from '$lib/stores/cart.js';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';

	/** @type {{ class?: string }} */
	let { class: className = '' } = $props();

	let itemCount = $derived($cart.reduce((sum, item) => sum + item.quantity, 0));
	let isAdminPage = $derived($page.url.pathname.startsWith('/admin'));
	let searchOpen = $state(false);
	let searchValue = $state('');

	/**
	 * @param {string} path
	 */
	function isActive(path) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}

	function closeSearch() {
		searchOpen = false;
		searchValue = '';
	}
</script>

<nav class="sticky top-0 z-[100] border-b border-brand-dark/30 bg-brand-dark shadow-lg {className}">
	<div
		class="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4 lg:px-8"
	>
		<a href="/" class="flex min-w-0 items-center gap-2 sm:gap-3">
			<img
				src="/logo.png.avif"
				alt="Henry's Liquidation Store"
				class="h-9 w-auto shrink-0 drop-shadow-md sm:h-12"
			/>
			<span
				class="hidden truncate text-xl font-bold tracking-tight text-white drop-shadow-sm sm:block sm:text-2xl"
				>Henry's Liquidation</span
			>
		</a>

		<!-- Nav destinations — always visible at every breakpoint, no hamburger/accordion -->
		{#if !isAdminPage}
			{#if searchOpen}
				<!-- Desktop: search replaces the nav cluster inline -->
				<div class="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
					<SearchBar
						bind:value={searchValue}
						id="nav-search-desktop"
						autofocus
						onClose={closeSearch}
					/>
					<button
						type="button"
						onclick={closeSearch}
						aria-label="Close search"
						class="shrink-0 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Mobile: search opens as a full-width overlay sheet -->
				<div class="fixed inset-0 z-[110] flex flex-col gap-3 bg-brand-bg p-4 sm:hidden">
					<div class="flex items-center gap-2">
						<SearchBar
							bind:value={searchValue}
							id="nav-search-mobile"
							autofocus
							onClose={closeSearch}
						/>
						<button
							type="button"
							onclick={closeSearch}
							aria-label="Close search"
							class="shrink-0 rounded-full p-2 text-brand-dark hover:bg-brand-light/50"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<div class="flex shrink-0 items-center gap-1.5 sm:gap-3">
					<button
						type="button"
						onclick={() => (searchOpen = true)}
						aria-label="Search"
						class="rounded-full p-2.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
					>
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					<a
						href="/"
						class="rounded-full px-2.5 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white sm:px-3 sm:text-base {isActive(
							'/'
						)
							? 'bg-white/10 text-white'
							: ''}"
					>
						Home
					</a>

					<Button
						href="/shop"
						variant="primary"
						pill
						size="sm"
						class="sm:px-5 sm:py-2 sm:text-base {isActive('/shop')
							? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark'
							: ''}"
					>
						Shop
					</Button>

					<Button
						href="/cart"
						variant="ghost"
						pill
						size="sm"
						aria-label="Cart"
						class="group relative !bg-white !text-brand-dark hover:scale-105 hover:!bg-gray-100 hover:shadow-lg sm:px-4 {isActive(
							'/cart'
						)
							? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark'
							: ''}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5 sm:h-6 sm:w-6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
							/>
						</svg>
						{#if itemCount > 0}
							<span
								class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-110"
							>
								{itemCount > 9 ? '9+' : itemCount}
							</span>
						{/if}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</nav>
