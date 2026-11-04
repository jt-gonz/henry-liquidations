<script>
	import { onMount } from 'svelte';
	import { track } from '@vercel/analytics';

	let { data, children } = $props();
	let mobileMenuOpen = $state(false);

	// Track admin access
	onMount(() => {
		if (data.user?.email) {
			track('admin_access', {
				admin_email: data.user.email,
				timestamp: new Date().toISOString()
			});
		}
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<div class="flex min-h-[80vh] flex-col lg:flex-row">
	<!-- Floating Menu Button - Mobile Only -->
	<div class="mt-8 mb-4 flex items-center justify-center lg:hidden">
		<button
			type="button"
			onclick={toggleMobileMenu}
			class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl hover:ring-gray-300"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
			<span>Admin Menu</span>
		</button>
	</div>

	<!-- Admin Sidebar - Desktop -->
	<aside class="hidden w-64 border-r border-gray-200 bg-white px-6 py-8 lg:block">
		<div class="mb-8 flex items-center gap-2 px-2">
			<h2 class="text-sm font-bold tracking-wider text-gray-500 uppercase">Admin</h2>
		</div>
		<nav class="space-y-1">
			<a
				href="/admin/analytics"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z"
						/></svg
					>
				</span>
				Analytics
			</a>
			<a
				href="/admin/inventory"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							fill-rule="evenodd"
							d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
							clip-rule="evenodd"
						/></svg
					>
				</span>
				Inventory
			</a>
			<a
				href="/admin/add"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							fill-rule="evenodd"
							d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
							clip-rule="evenodd"
						/></svg
					>
				</span>
				Add Product
			</a>
			<a
				href="/admin/categories"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg
					>
				</span>
				Categories
			</a>
			<a
				href="/admin/shipping-rates"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
						/><path
							d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0h4.1a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4.586a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 6H14V5a1 1 0 00-1-1H3z"
						/></svg
					>
				</span>
				Shipping Rates
			</a>
			<a
				href="/admin/orders"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							fill-rule="evenodd"
							d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h12a2 2 0 002-2V9H2zm3 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
							clip-rule="evenodd"
						/></svg
					>
				</span>
				Orders
			</a>
			<a
				href="/admin/newsletter"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
						/><path
							d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
						/></svg
					>
				</span>
				Newsletter
			</a>
			<a
				href="/admin/quotes"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path
							fill-rule="evenodd"
							d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z"
							clip-rule="evenodd"
						/></svg
					>
				</span>
				Add Quote
			</a>
		</nav>
		<div class="mt-auto border-t border-gray-100 pt-8">
			{#if data.user?.email}
				<div class="mb-4 flex items-center px-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600"
					>
						{data.user.email[0].toUpperCase()}
					</div>
					<div class="ml-3">
						<p class="max-w-[120px] truncate text-sm font-medium text-gray-700">
							{data.user.email}
						</p>
					</div>
				</div>
			{/if}
			<form method="POST" action="/login?/logout">
				<button
					type="submit"
					class="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
				>
					<span class="mr-3 text-gray-400 group-hover:text-red-500">
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
							><path
								fill-rule="evenodd"
								d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
								clip-rule="evenodd"
							/></svg
						>
					</span>
					Sign Out
				</button>
			</form>
		</div>
	</aside>

	<!-- Floating Admin Menu Modal - Mobile Only -->
	{#if mobileMenuOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden">
			<!-- Backdrop -->
			<button
				type="button"
				class="fixed inset-0 cursor-default bg-black/50 backdrop-blur-sm"
				aria-label="Close menu"
				onclick={closeMobileMenu}
			></button>

			<!-- Menu Panel -->
			<div class="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h2 class="text-lg font-bold tracking-tight text-gray-900">Admin Panel</h2>
					<button
						type="button"
						onclick={closeMobileMenu}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
					>
						<span class="sr-only">Close menu</span>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<nav class="space-y-2 px-4 py-6">
					<a
						href="/admin/analytics"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z"
								/></svg
							>
						</span>
						Analytics
					</a>
					<a
						href="/admin/inventory"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									fill-rule="evenodd"
									d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Inventory
					</a>
					<a
						href="/admin/add"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									fill-rule="evenodd"
									d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Add Product
					</a>
					<a
						href="/admin/categories"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
								/></svg
							>
						</span>
						Categories
					</a>
					<a
						href="/admin/shipping-rates"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
								/><path
									d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0h4.1a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4.586a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 6H14V5a1 1 0 00-1-1H3z"
								/></svg
							>
						</span>
						Shipping Rates
					</a>
					<a
						href="/admin/orders"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									fill-rule="evenodd"
									d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h12a2 2 0 002-2V9H2zm3 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Orders
					</a>
					<a
						href="/admin/newsletter"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
								/><path
									d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
								/></svg
							>
						</span>
						Newsletter
					</a>
					<a
						href="/admin/quotes"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path
									fill-rule="evenodd"
									d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Add Quote
					</a>
				</nav>

				<div class="border-t border-gray-100 px-4 py-4">
					{#if data.user?.email}
						<div class="mb-4 flex items-center gap-3 px-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600"
							>
								{data.user.email[0].toUpperCase()}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-700">
									{data.user.email}
								</p>
							</div>
						</div>
					{/if}
					<form method="POST" action="/login?/logout">
						<button
							type="submit"
							class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
						>
							<span class="text-gray-400">
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
									><path
										fill-rule="evenodd"
										d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
										clip-rule="evenodd"
									/></svg
								>
							</span>
							Sign Out
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Admin Content -->
	<div class="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
		{@render children()}
	</div>
</div>
