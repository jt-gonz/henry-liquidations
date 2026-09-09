<!-- Shop Page: Sidebar filters + search on left, product grid on right -->
<script>
	import { goto } from '$app/navigation';
	import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();

	/** @type {{ id: string, value: string, label: string, sort_order: number, is_active: boolean }[]} */
	let categories = $derived(/** @type {any} */ (data).categories ?? []);

	/** @type {import('$lib/types/database.js').ProductRow[]} */
	let products = $state([]);
	let total = $state(0);
	let hasMore = $state(false);
	/** @type {string | null} */
	let nextCursor = $state(null);
	let loading = $state(false);

	// ── Filters ─────────────────────────────────────────────
	let selectedCategory = $state('');
	let minPrice = $state('');
	let maxPrice = $state('');
	let inStock = $state('true');
	let searchQuery = $state('');
	let washerDryer = $state(false);
	let sortBy = $state('newest');

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let debounceTimeout;

	// Initialize and sync when server data changes
	$effect(() => {
		products = data.products;
		total = /** @type {any} */ (data).total ?? 0;
		hasMore = data.hasMore;
		nextCursor = data.nextCursor;

		// Sync filters on navigation (e.g. back button)
		selectedCategory = data.filters?.category ?? '';
		minPrice = data.filters?.minPrice ?? '';
		maxPrice = data.filters?.maxPrice ?? '';
		inStock = data.filters?.inStock ?? 'true';
		searchQuery = data.filters?.search ?? '';
		washerDryer = data.filters?.washerDryer ?? false;
		sortBy = data.filters?.sort ?? 'newest';
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

		if (washerDryer) {
			params.set('washerDryer', 'true');
		} else if (selectedCategory) {
			params.set('category', selectedCategory);
		}

		if (minPrice) params.set('minPrice', minPrice);
		if (maxPrice) params.set('maxPrice', maxPrice);

		// Always include inStock, even when empty — an *absent* param and an
		// *empty* param mean different things server-side (absent defaults
		// back to "true"), so omitting it here would silently undo "Include
		// sold items".
		params.set('inStock', inStock);
		if (searchQuery) params.set('search', searchQuery);
		if (sortBy && sortBy !== 'newest') params.set('sort', sortBy);
		return params;
	}

	// All filters apply instantly — no separate "Apply" step. Uses client-side
	// navigation (not a hard reload) so it stays smooth even when several
	// filters change in quick succession.
	function applyFilters() {
		const params = buildFilterParams();
		goto(`/shop${params.toString() ? '?' + params.toString() : ''}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	/** Debounced apply for free-typing inputs (search, price) so we don't navigate on every keystroke. */
	function applyFiltersDebounced() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(applyFilters, 400);
	}

	function toggleWasherDryer() {
		washerDryer = !washerDryer;
		if (washerDryer) selectedCategory = '';
		applyFilters();
	}

	function handleCategoryChange() {
		washerDryer = false;
		applyFilters();
	}

	function handleAvailabilityChange() {
		inStock = inStock === 'true' ? '' : 'true';
		applyFilters();
	}

	function handleSortChange() {
		applyFilters();
	}

	function clearSearch() {
		searchQuery = '';
		applyFilters();
	}

	function clearFilters() {
		selectedCategory = '';
		minPrice = '';
		maxPrice = '';
		inStock = 'true';
		searchQuery = '';
		washerDryer = false;
		sortBy = 'newest';
		goto('/shop', { keepFocus: true });
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
			searchQuery !== '' ||
			washerDryer
	);

	/** Removable chips summarizing the currently active filters. */
	let activeFilterChips = $derived.by(() => {
		/** @type {{ key: string, label: string, remove: () => void }[]} */
		const chips = [];

		if (searchQuery) {
			chips.push({
				key: 'search',
				label: `"${searchQuery}"`,
				remove: () => {
					searchQuery = '';
					applyFilters();
				}
			});
		}

		if (washerDryer) {
			chips.push({
				key: 'washerDryer',
				label: 'Washers & Dryers',
				remove: () => {
					washerDryer = false;
					applyFilters();
				}
			});
		} else if (selectedCategory) {
			const label =
				categories.find((c) => c.value === selectedCategory)?.label ?? selectedCategory;
			chips.push({
				key: 'category',
				label,
				remove: () => {
					selectedCategory = '';
					applyFilters();
				}
			});
		}

		if (minPrice || maxPrice) {
			const label =
				minPrice && maxPrice
					? `$${minPrice} – $${maxPrice}`
					: minPrice
						? `$${minPrice}+`
						: `Under $${maxPrice}`;
			chips.push({
				key: 'price',
				label,
				remove: () => {
					minPrice = '';
					maxPrice = '';
					applyFilters();
				}
			});
		}

		if (inStock === '') {
			chips.push({
				key: 'inStock',
				label: 'Including sold',
				remove: () => {
					inStock = 'true';
					applyFilters();
				}
			});
		}

		return chips;
	});

	let filtersOpen = $state(false);
</script>

<svelte:head>
	<title>Shop Collection | Henry's Liquidation Store</title>
	<meta
		name="description"
		content="Browse our full collection of liquidation furniture and appliances, including washers and dryers. Filter by category, price, and availability."
	/>
	<meta property="og:title" content="Shop Collection | Henry's Liquidation Store" />
	<meta
		property="og:description"
		content="Browse our full collection of liquidation furniture and appliances, including washers and dryers."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="border-b border-brand-light pb-10">
		<h1 class="text-4xl font-bold tracking-tight text-brand-dark">Shop Collection</h1>
		<p class="mt-4 text-base text-gray-600">
			Our latest arrivals of discounted premium furniture. Updated daily.
		</p>
	</div>

	<!-- Active filter chips — always visible, one tap to remove -->
	{#if hasActiveFilters}
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<span class="text-xs font-semibold tracking-wide text-brand-mid uppercase">Filtering by</span>
			{#each activeFilterChips as chip (chip.key)}
				<button
					type="button"
					onclick={chip.remove}
					class="inline-flex items-center gap-1.5 rounded-full bg-brand-brown/10 py-1.5 pr-2 pl-3 text-xs font-medium text-brand-brown-dark transition-colors hover:bg-brand-brown/20"
				>
					{chip.label}
					<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M5.28 4.22a.75.75 0 00-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 101.06 1.06L10 11.06l4.72 4.72a.75.75 0 101.06-1.06L11.06 10l4.72-4.72a.75.75 0 00-1.06-1.06L10 8.94 5.28 4.22z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			{/each}
			<button
				type="button"
				onclick={clearFilters}
				class="text-xs font-medium text-brand-mid underline decoration-dotted underline-offset-2 hover:text-brand-dark"
			>
				Clear all
			</button>
		</div>
	{/if}

	<div class="mt-6 lg:grid lg:grid-cols-4 lg:gap-x-8">
		<!-- ── Left Sidebar: Search + Filters ────────────────── -->
		<aside class="lg:col-span-1">
			<!-- Mobile toggle -->
			<button
				type="button"
				onclick={() => (filtersOpen = !filtersOpen)}
				class="flex w-full items-center justify-between rounded-xl border border-brand-light bg-white px-4 py-3 text-sm font-medium text-brand-dark shadow-sm lg:hidden"
			>
				<span class="flex items-center gap-2">
					<svg class="h-4 w-4 text-brand-mid" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
							clip-rule="evenodd"
						/>
					</svg>
					Filters
					{#if hasActiveFilters}
						<span class="rounded-full bg-brand-brown px-2 py-0.5 text-xs text-white"
							>{activeFilterChips.length}</span
						>
					{/if}
				</span>
				<svg
					class="h-4 w-4 text-brand-mid transition-transform {filtersOpen ? 'rotate-180' : ''}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<!-- Filter panel card — always visible on lg, collapsible on mobile -->
			<div
				class="sticky top-4 mt-3 space-y-5 rounded-xl border border-brand-light/60 bg-white p-5 shadow-sm {filtersOpen
					? ''
					: 'hidden'} lg:mt-0 lg:block"
			>
				<!-- Search Bar -->
				<div>
					<label
						for="search"
						class="mb-1.5 block text-xs font-semibold tracking-wide text-brand-dark uppercase"
						>Search</label
					>
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
							oninput={applyFiltersDebounced}
							class="block w-full rounded-lg border border-brand-light bg-brand-bg py-2.5 pr-9 pl-9 text-sm text-brand-dark placeholder-brand-mid/60 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
						/>
						{#if searchQuery}
							<button
								type="button"
								onclick={clearSearch}
								aria-label="Clear search"
								class="absolute top-1/2 right-2.5 -translate-y-1/2 text-brand-mid hover:text-brand-dark"
							>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M5.28 4.22a.75.75 0 00-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 101.06 1.06L10 11.06l4.72 4.72a.75.75 0 101.06-1.06L11.06 10l4.72-4.72a.75.75 0 00-1.06-1.06L10 8.94 5.28 4.22z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>

				<!-- Washers & Dryers quick filter -->
				<button
					type="button"
					onclick={toggleWasherDryer}
					class="flex w-full items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition-colors {washerDryer
						? 'border-brand-brown bg-brand-brown text-white'
						: 'border-brand-light bg-brand-bg text-brand-dark hover:border-brand-brown/40 hover:bg-brand-brown/5'}"
				>
					Washers &amp; Dryers
				</button>

				<!-- Category -->
				<div>
					<label
						for="filter-category"
						class="mb-1.5 block text-xs font-semibold tracking-wide text-brand-dark uppercase"
						>Category</label
					>
					<select
						id="filter-category"
						bind:value={selectedCategory}
						onchange={handleCategoryChange}
						class="block w-full rounded-lg border border-brand-light bg-brand-bg px-3 py-2.5 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
					>
						<option value="">All Categories</option>
						{#each categories as cat}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
				</div>

				<!-- Price Range -->
				<div>
					<span class="mb-1.5 block text-xs font-semibold tracking-wide text-brand-dark uppercase"
						>Price Range</span
					>
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<span
								class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-brand-mid"
								>$</span
							>
							<input
								type="number"
								min="0"
								placeholder="Min"
								bind:value={minPrice}
								oninput={applyFiltersDebounced}
								class="block w-full rounded-lg border border-brand-light bg-brand-bg py-2.5 pr-2 pl-6 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
							/>
						</div>
						<span class="text-brand-mid">–</span>
						<div class="relative flex-1">
							<span
								class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-brand-mid"
								>$</span
							>
							<input
								type="number"
								min="0"
								placeholder="Max"
								bind:value={maxPrice}
								oninput={applyFiltersDebounced}
								class="block w-full rounded-lg border border-brand-light bg-brand-bg py-2.5 pr-2 pl-6 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Availability -->
				<label class="flex cursor-pointer items-center gap-2.5 text-sm text-brand-dark select-none">
					<input
						type="checkbox"
						checked={inStock === ''}
						onchange={handleAvailabilityChange}
						class="h-4 w-4 rounded border-brand-light text-brand-brown focus:ring-brand-brown"
					/>
					Include sold items
				</label>

				{#if hasActiveFilters}
					<button
						type="button"
						onclick={clearFilters}
						class="w-full rounded-lg border border-brand-light bg-white py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-bg"
					>
						Clear All Filters
					</button>
				{/if}
			</div>
		</aside>

		<!-- ── Right: Product Grid ───────────────────────────── -->
		<div class="mt-8 lg:col-span-3 lg:mt-0">
			<div class="mb-4 flex items-center justify-between gap-4">
				<p class="text-sm text-brand-mid">
					{#if total > 0}
						Showing <span class="font-medium text-brand-dark">{products.length}</span> of
						<span class="font-medium text-brand-dark">{total}</span> products
					{/if}
				</p>
				<div class="shrink-0">
					<label for="sort-by" class="sr-only">Sort by</label>
					<select
						id="sort-by"
						bind:value={sortBy}
						onchange={handleSortChange}
						class="rounded-lg border border-brand-light bg-brand-bg px-3 py-2 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
					>
						<option value="newest">Sort: Newest</option>
						<option value="price_asc">Sort: Price (Low to High)</option>
						<option value="price_desc">Sort: Price (High to Low)</option>
					</select>
				</div>
			</div>
			{#if products.length === 0}
				<p class="py-12 text-center text-gray-600">
					No products match your criteria. Try adjusting your filters.
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{#each products as product (product.id)}
						<ProductCard
							id={product.id}
							name={product.name}
							slug={product.slug}
							price={Number(product.price)}
							image_url={product.image_url}
							category={product.categoryLabel || product.category}
							in_stock={product.in_stock}
							created_at={product.created_at}
							colors={product.colors}
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
