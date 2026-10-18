<!-- Shop Page: top filter bar (search + category pills + sort) over the product grid -->
<script>
	import { goto } from '$app/navigation';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { WASHER_DRYER_SLUG } from '$lib/constants/shop.js';

	let { data } = $props();

	/** @type {{ id: string, value: string, label: string, slug: string, sort_order: number, is_active: boolean }[]} */
	let categories = $derived(/** @type {any} */ (data).categories ?? []);
	let pageTitle = $derived(/** @type {any} */ (data).pageTitle ?? "Shop Collection | Henry's Liquidation Store");
	let pageDescription = $derived(
		/** @type {any} */ (data).pageDescription ??
			'Browse our full collection of liquidation furniture and appliances.'
	);
	let canonicalUrl = $derived(/** @type {any} */ (data).canonicalUrl ?? '');

	/** @type {(import('$lib/types/database.js').ProductRow & { categoryLabel?: string, available_quantity?: number | null })[]} */
	let products = $state([]);
	let total = $state(0);
	let hasMore = $state(false);
	/** @type {string | null} */
	let nextCursor = $state(null);
	let loading = $state(false);

	// ── Filters ─────────────────────────────────────────────
	let selectedCategory = $state('');
	let categorySlug = $state('');
	let minPrice = $state('');
	let maxPrice = $state('');
	let inStock = $state('true');
	let searchQuery = $state('');
	let washerDryer = $state(false);
	let sortBy = $state('newest');
	let moreFiltersOpen = $state(false);

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
		categorySlug = /** @type {any} */ (data).categorySlug ?? '';
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

	/** Secondary filter params (price/search/sort/inStock) — category lives in the path, not here. */
	function buildOtherParams() {
		const params = new URLSearchParams();

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

	/** Builds a /shop or /shop/{slug} URL (real, crawlable path) with the current secondary filters layered on as query params. @param {string} slug */
	function categoryHref(slug) {
		const qs = buildOtherParams().toString();
		return `/shop${slug ? '/' + slug : ''}${qs ? '?' + qs : ''}`;
	}

	// All filters apply instantly — no separate "Apply" step. Uses client-side
	// navigation (not a hard reload) so it stays smooth even when several
	// filters change in quick succession.
	function applyFilters() {
		goto(categoryHref(categorySlug), { keepFocus: true, noScroll: true });
	}

	/** Debounced apply for free-typing inputs (search, price) so we don't navigate on every keystroke. */
	function applyFiltersDebounced() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(applyFilters, 400);
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
		minPrice = '';
		maxPrice = '';
		inStock = 'true';
		searchQuery = '';
		moreFiltersOpen = false;
		goto(categoryHref(categorySlug), { keepFocus: true });
	}

	async function loadMore() {
		if (loading || !hasMore || !nextCursor) return;
		loading = true;

		try {
			// /api/products is an internal JSON endpoint (never crawled), so it
			// stays query-param-based — category goes by value, not slug.
			const params = buildOtherParams();
			if (washerDryer) {
				params.set('washerDryer', 'true');
			} else if (selectedCategory) {
				params.set('category', selectedCategory);
			}
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

	/** Only the filters tucked inside the "More filters" popover. */
	let moreFiltersActiveCount = $derived(
		(minPrice !== '' || maxPrice !== '' ? 1 : 0) + (inStock !== 'true' ? 1 : 0)
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
				remove: () => goto(categoryHref(''), { keepFocus: true, noScroll: true })
			});
		} else if (selectedCategory) {
			const label =
				categories.find((c) => c.value === selectedCategory)?.label ?? selectedCategory;
			chips.push({
				key: 'category',
				label,
				remove: () => goto(categoryHref(''), { keepFocus: true, noScroll: true })
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
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	{#if canonicalUrl}
		<link rel="canonical" href={canonicalUrl} />
	{/if}
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:type" content="website" />
	{#if canonicalUrl}
		<meta property="og:url" content={canonicalUrl} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="border-b border-brand-light pb-10">
		<h1 class="text-4xl font-bold tracking-tight text-brand-dark">
			{washerDryer
				? 'Washers & Dryers'
				: (categories.find((c) => c.value === selectedCategory)?.label ?? 'Shop Collection')}
		</h1>
		<p class="mt-4 text-base text-brand-mid">
			Our latest arrivals of discounted premium furniture. Updated daily.
		</p>
	</div>

	<!-- ── Top filter bar: search + category pill rail + sort ───────────── -->
	<div class="sticky top-[73px] z-30 -mx-4 mt-6 space-y-3 bg-brand-bg/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<!-- Search -->
			<div class="relative flex-1">
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
					class="block w-full rounded-[var(--radius-md)] border border-brand-light bg-white py-2.5 pr-9 pl-9 text-sm text-brand-dark placeholder-brand-mid/60 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
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

			<div class="flex shrink-0 items-center gap-2">
				<!-- More filters popover trigger -->
				<div class="relative">
					<Button
						variant="outline"
						size="md"
						onclick={() => (moreFiltersOpen = !moreFiltersOpen)}
						class="!bg-white"
					>
						<svg class="h-4 w-4 text-brand-mid" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
								clip-rule="evenodd"
							/>
						</svg>
						More filters
						{#if moreFiltersActiveCount > 0}
							<span class="rounded-full bg-brand-brown px-1.5 py-0.5 text-[10px] text-white"
								>{moreFiltersActiveCount}</span
							>
						{/if}
					</Button>

					{#if moreFiltersOpen}
						<!-- Backdrop closes the popover on outside click -->
						<button
							type="button"
							class="fixed inset-0 z-40 cursor-default"
							aria-label="Close filters"
							onclick={() => (moreFiltersOpen = false)}
						></button>
						<div
							class="absolute top-full right-0 z-50 mt-2 w-72 space-y-5 rounded-[var(--radius-lg)] border border-brand-light bg-white p-5 shadow-xl"
						>
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
											class="block w-full rounded-[var(--radius-sm)] border border-brand-light bg-brand-bg py-2 pr-2 pl-6 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
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
											class="block w-full rounded-[var(--radius-sm)] border border-brand-light bg-brand-bg py-2 pr-2 pl-6 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
										/>
									</div>
								</div>
							</div>

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
									class="w-full rounded-[var(--radius-sm)] border border-brand-light bg-white py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-bg"
								>
									Clear All Filters
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Sort -->
				<label for="sort-by" class="sr-only">Sort by</label>
				<select
					id="sort-by"
					bind:value={sortBy}
					onchange={handleSortChange}
					class="rounded-[var(--radius-md)] border border-brand-light bg-white px-3 py-2.5 text-sm text-brand-dark focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
				>
					<option value="newest">Newest</option>
					<option value="price_asc">Price: Low to High</option>
					<option value="price_desc">Price: High to Low</option>
				</select>
			</div>
		</div>

		<!-- Category pill rail — Washers & Dryers pinned first, our best-seller -->
		<div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
			<Chip
				label="Washers & Dryers"
				active={washerDryer}
				accent
				href={categoryHref(WASHER_DRYER_SLUG)}
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="13" r="5" />
					<path stroke-linecap="round" d="M5 3h2M9 3h2" />
					<path stroke-linecap="round" d="M12 13a3.5 3.5 0 0 0 3.5-3.5" />
				</svg>
			</Chip>
			<Chip label="All" active={!washerDryer && !selectedCategory} href={categoryHref('')} />
			{#each categories as cat (cat.id)}
				<Chip
					label={cat.label}
					active={!washerDryer && selectedCategory === cat.value}
					href={categoryHref(cat.slug)}
				/>
			{/each}
		</div>
	</div>

	<!-- Active filter chips — always visible, one tap to remove -->
	{#if hasActiveFilters}
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<span class="text-xs font-semibold tracking-wide text-brand-mid uppercase">Filtering by</span>
			{#each activeFilterChips as chip (chip.key)}
				<Chip label={chip.label} removable onRemove={chip.remove} />
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

	<!-- ── Product Grid ───────────────────────────────────────────────── -->
	<div class="mt-6">
		<p class="mb-4 text-sm text-brand-mid">
			{#if total > 0}
				Showing <span class="font-medium text-brand-dark">{products.length}</span> of
				<span class="font-medium text-brand-dark">{total}</span> products
			{/if}
		</p>

		{#if products.length === 0}
			<p class="py-12 text-center text-brand-mid">
				No products match your criteria. Try adjusting your filters.
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
				{#each products as product (product.id)}
					<ProductCard
						id={product.id}
						name={product.name}
						slug={product.slug}
						price={Number(product.price)}
						compare_at_price={product.compare_at_price != null
							? Number(product.compare_at_price)
							: null}
						image_url={product.image_url}
						category={product.categoryLabel || product.category}
						in_stock={product.in_stock}
						available_quantity={product.available_quantity}
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
