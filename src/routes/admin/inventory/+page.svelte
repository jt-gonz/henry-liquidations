<!-- Admin Inventory -->
<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	/** @type {any[]} */
	let products = $derived(data.products ?? []);

	let search = $state('');
	let categoryFilter = $state('all');
	let stockFilter = $state('all');

	let categories = $derived(
		Array.from(new Set(products.map((p) => p.category))).sort()
	);

	let filtered = $derived(
		products.filter((p) => {
			if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
			if (stockFilter === 'low') {
				if (p.available_quantity === null || p.available_quantity > 3 || p.available_quantity === 0)
					return false;
			} else if (stockFilter === 'out') {
				if (p.in_stock) return false;
			} else if (stockFilter === 'in') {
				if (!p.in_stock) return false;
			}
			if (search.trim()) {
				const q = search.trim().toLowerCase();
				if (!p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
			}
			return true;
		})
	);

	let totals = $derived({
		total: products.length,
		inStock: products.filter((p) => p.in_stock).length,
		outOfStock: products.filter((p) => !p.in_stock).length,
		lowStock: products.filter(
			(p) => p.available_quantity !== null && p.available_quantity > 0 && p.available_quantity <= 3
		).length
	});

	/** @type {Record<string, string>} */
	let quantityDrafts = $state({});

	/** @param {any} product */
	function draftValue(product) {
		return quantityDrafts[product.id] ?? (product.stock_quantity ?? '');
	}
</script>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Inventory</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Summary -->
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-brand-light/50">
			<div class="text-2xl font-bold text-brand-dark">{totals.total}</div>
			<div class="text-xs text-brand-mid uppercase">Products</div>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-brand-light/50">
			<div class="text-2xl font-bold text-green-700">{totals.inStock}</div>
			<div class="text-xs text-brand-mid uppercase">In Stock</div>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-brand-light/50">
			<div class="text-2xl font-bold text-red-700">{totals.outOfStock}</div>
			<div class="text-xs text-brand-mid uppercase">Out of Stock</div>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-brand-light/50">
			<div class="text-2xl font-bold text-amber-600">{totals.lowStock}</div>
			<div class="text-xs text-brand-mid uppercase">Low Stock (&le;3)</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex flex-wrap gap-3">
		<input
			type="text"
			placeholder="Search name or slug…"
			bind:value={search}
			class="min-w-[220px] flex-1 rounded-md border border-brand-light px-3 py-2 text-sm shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
		/>
		<select
			bind:value={categoryFilter}
			class="rounded-md border border-brand-light px-3 py-2 text-sm shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
		>
			<option value="all">All categories</option>
			{#each categories as cat}
				<option value={cat}>{cat}</option>
			{/each}
		</select>
		<select
			bind:value={stockFilter}
			class="rounded-md border border-brand-light px-3 py-2 text-sm shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
		>
			<option value="all">All stock</option>
			<option value="in">In stock</option>
			<option value="low">Low stock (&le;3)</option>
			<option value="out">Out of stock</option>
		</select>
	</div>

	<p class="mb-2 text-xs text-brand-mid">Showing {filtered.length} of {products.length}</p>

	<div class="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th class="py-3 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6">Product</th>
					<th class="hidden px-3 py-3 text-left text-sm font-bold text-brand-dark sm:table-cell">Category</th>
					<th class="hidden px-3 py-3 text-left text-sm font-bold text-brand-dark sm:table-cell">Price</th>
					<th class="px-3 py-3 text-left text-sm font-bold text-brand-dark">Stock</th>
					<th class="px-3 py-3 text-left text-sm font-bold text-brand-dark">Status</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if filtered.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-600">
							No products match those filters.
						</td>
					</tr>
				{:else}
					{#each filtered as product (product.id)}
						<tr>
							<td class="py-3 pr-3 pl-4 sm:pl-6">
								<div class="flex items-center gap-3">
									<div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-brand-light bg-brand-bg">
										{#if product.image_url?.[0]}
											<img src={product.image_url[0]} alt="" class="h-full w-full object-cover" />
										{/if}
									</div>
									<div class="min-w-0">
										<a
											href="/admin/edit/{product.id}"
											class="block max-w-[200px] truncate text-sm font-bold text-brand-dark hover:text-brand-brown sm:max-w-none"
										>
											{product.name}
										</a>
										{#if product.is_bundle}
											<div class="text-xs text-brand-mid">
												Bundle of: {product.component_names.join(', ')}
											</div>
										{/if}
									</div>
								</div>
							</td>
							<td class="hidden px-3 py-3 text-sm text-brand-mid sm:table-cell">{product.category}</td>
							<td class="hidden px-3 py-3 text-sm font-medium text-brand-brown sm:table-cell">
								${Number(product.price).toFixed(2)}
							</td>
							<td class="px-3 py-3">
								{#if product.is_bundle}
									<span class="text-sm text-brand-mid" title="Computed from component stock — not directly editable">
										{product.available_quantity} (auto)
									</span>
								{:else if product.stock_quantity !== null}
									<form
										method="POST"
										action="?/updateQuantity"
										class="flex items-center gap-2"
										use:enhance
									>
										<input type="hidden" name="id" value={product.id} />
										<input
											type="number"
											name="quantity"
											min="0"
											value={draftValue(product)}
											oninput={(e) =>
												(quantityDrafts = {
													...quantityDrafts,
													[product.id]: /** @type {HTMLInputElement} */ (e.target).value
												})}
											class="w-20 rounded-md border border-brand-light px-2 py-1 text-sm shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
										/>
										<button
											type="submit"
											class="rounded-md bg-brand-dark px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-mid"
										>
											Save
										</button>
									</form>
								{:else}
									<form method="POST" action="?/toggleInStock" use:enhance>
										<input type="hidden" name="id" value={product.id} />
										<input type="hidden" name="in_stock" value={(!product.in_stock).toString()} />
										<button
											type="submit"
											class="text-xs font-medium text-brand-mid underline hover:text-brand-dark"
										>
											Mark {product.in_stock ? 'sold' : 'in stock'}
										</button>
									</form>
								{/if}
							</td>
							<td class="px-3 py-3">
								{#if product.in_stock}
									<span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
										In Stock
									</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset">
										Sold
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
