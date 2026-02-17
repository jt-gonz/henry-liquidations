<!-- Shop Page: Sidebar filters + search on left, product grid on right -->
<script>
	import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();

	/** @type {import('$lib/types/database.js').ProductRow[]} */
	let products = $state([]);
	let hasMore = $state(false);
	/** @type {string | null} */
	let nextCursor = $state(null);
	let loading = $state(false);

	// ── Filters ─────────────────────────────────────────────
	// Categories mapped from units_processed.csv
	const categories = [
		'LIVING ROOM COLLECTION',
		'RECLINER COLLECTION',
		'ACCENTS COLLECTION',
		'OCCASIONAL COLLECTION',
		'ACCESSORIES COLLECTION'
	];

	let selectedCategory = $state('');

	// Price Range
	let minPrice = $state('');
	let maxPrice = $state('');

	let inStock = $state('true');
	let searchQuery = $state('');

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let searchTimeout;

	// Initialize and sync when server data changes
	$effect(() => {
		products = data.products;
		hasMore = data.hasMore;
		nextCursor = data.nextCursor;

		// Sync filters on navigation (e.g. back button)
		selectedCategory = data.filters?.category ?? '';
		minPrice = data.filters?.minPrice ?? '';
		maxPrice = data.filters?.maxPrice ?? '';
		inStock = data.filters?.inStock ?? 'true';
		searchQuery = data.filters?.search ?? '';
	});

	/** @type {HTMLDivElement | undefined} */
	let sentinel = $state();

	// Intersection Observer for infinite scroll
	$effect(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});

	function buildFilterParams() {
		const params = new URLSearchParams();
		if (selectedCategory) params.set('category', selectedCategory);

		if (minPrice) params.set('minPrice', minPrice);
		if (maxPrice) params.set('maxPrice', maxPrice);

		if (inStock) params.set('inStock', inStock);
		if (searchQuery) params.set('search', searchQuery);
		return params;
	}

	function applyFilters() {
		const params = buildFilterParams();
		window.location.href = `/shop${params.toString() ? '?' + params.toString() : ''}`;
	}

	function clearFilters() {
		selectedCategory = '';
		minPrice = '';
		maxPrice = '';
		inStock = 'true';
		searchQuery = '';
		window.location.href = '/shop';
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			applyFilters();
		}, 400);
	}

	async function loadMore() {
		if (loading || !hasMore || !nextCursor) return;
		loading = true;

		try {
			const params = buildFilterParams();
			params.set('cursor', nextCursor);
			params.set('limit', '12');

			const res = await fetch(`/api/products?${params.toString()}`);
			const json = await res.json();

			if (json.products.length > 0) {
				products = [...products, ...json.products];
				nextCursor = json.nextCursor;
				hasMore = json.hasMore;
			} else {
				hasMore = false;
			}
		} catch (e) {
			console.error('Failed to load more products:', e);
		} finally {
			loading = false;
		}
	}

	let hasActiveFilters = $derived(
		selectedCategory !== '' ||
			minPrice !== '' ||
			maxPrice !== '' ||
			inStock !== 'true' ||
			searchQuery !== ''
	);
</script>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="border-b border-brand-light pb-10">
		<h1 class="text-4xl font-bold tracking-tight text-brand-dark">Shop Collection</h1>
		<p class="mt-4 text-base text-gray-600">
			Our latest arrivals of discounted premium furniture. Updated daily.
		</p>
	</div>

	<div class="mt-8 lg:grid lg:grid-cols-4 lg:gap-x-8">
		<!-- ── Left Sidebar: Search + Filters ────────────────── -->
		<aside class="lg:col-span-1">
			<div class="sticky top-4 space-y-6">
				<!-- Search Bar -->
				<div>
					<label for="search" class="mb-1 block text-xs font-medium text-brand-dark">Search</label>
					<div class="relative">
						<svg
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-mid"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
								clip-rule="evenodd"
							/>
						</svg>
						<input
							id="search"
							type="text"
							placeholder="Search products..."
							bind:value={searchQuery}
							oninput={handleSearch}
							class="block w-full rounded-md border border-brand-light bg-brand-bg py-2 pr-3 pl-9 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
					</div>
				</div>

				<!-- Category -->
				<div>
					<label for="filter-category" class="mb-1 block text-xs font-medium text-brand-dark"
						>Category</label
					>
					<select
						id="filter-category"
						bind:value={selectedCategory}
						class="block w-full rounded-md border border-brand-light bg-brand-bg px-2 py-2 text-sm text-brand-dark focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
					>
						<option value="">All Categories</option>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>

				<!-- Price Range -->
				<div>
					<span class="mb-2 block text-xs font-medium text-brand-dark">Price Range</span>
					<div class="flex items-center gap-2">
						<input
							type="number"
							min="0"
							placeholder="Min"
							bind:value={minPrice}
							class="block w-full rounded-md border border-brand-light bg-brand-bg px-2 py-2 text-sm text-brand-dark focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
						<span class="text-xs text-brand-mid">–</span>
						<input
							type="number"
							min="0"
							placeholder="Max"
							bind:value={maxPrice}
							class="block w-full rounded-md border border-brand-light bg-brand-bg px-2 py-2 text-sm text-brand-dark focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
					</div>
				</div>

				<!-- Availability -->
				<div>
					<label for="filter-stock" class="mb-1 block text-xs font-medium text-brand-dark"
						>Availability</label
					>
					<select
						id="filter-stock"
						bind:value={inStock}
						class="block w-full rounded-md border border-brand-light bg-brand-bg px-2 py-2 text-sm text-brand-dark focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
					>
						<option value="true">In Stock</option>
						<option value="">All Items</option>
						<option value="false">Sold</option>
					</select>
				</div>

				<!-- Buttons -->
				<div class="space-y-2">
					<button
						onclick={applyFilters}
						class="w-full rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-mid"
					>
						Apply Filters
					</button>
					{#if hasActiveFilters}
						<button
							onclick={clearFilters}
							class="w-full rounded-md border border-brand-light bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-bg"
						>
							Clear All
						</button>
					{/if}
				</div>
			</div>
		</aside>

		<!-- ── Right: Product Grid ───────────────────────────── -->
		<div class="mt-8 lg:col-span-3 lg:mt-0">
			{#if products.length === 0}
				<p class="py-12 text-center text-gray-600">
					No products match your criteria. Try adjusting your filters.
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{#each products as product (product.id)}
						<ProductCard
							name={product.name}
							slug={product.slug}
							price={Number(product.price)}
							image_url={product.image_url}
							category={product.category}
						/>
					{/each}
				</div>

				<!-- Infinite scroll sentinel -->
				{#if hasMore}
					<div bind:this={sentinel} class="flex justify-center py-8">
						{#if loading}
							<p class="text-sm text-brand-mid">Loading more products...</p>
						{/if}
					</div>
				{:else if products.length > 0}
					<p class="py-8 text-center text-sm text-brand-light">
						You've seen all {products.length} products.
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
