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
				href="/admin"
				class="group flex items-center rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
						><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path
							d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"
						/></svg
					>
				</span>
				Dashboard
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
			<div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick={closeMobileMenu}></div>

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
						href="/admin"
						onclick={closeMobileMenu}
						class="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
					>
						<span class="text-gray-400 group-hover:text-gray-500">
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
								><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path
									d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"
								/></svg
							>
						</span>
						Dashboard
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
