<!-- Admin Dashboard -->
<script>
	let { data, form } = $props();

	/** @type {any[]} */
	let products = $derived(/** @type {any} */ (data).products ?? []);
</script>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<!-- ── Product Inventory ──────────────────────────────────── -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Product Inventory</h1>
		<a
			href="/admin/add"
			class="inline-flex items-center justify-center rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-mid"
		>
			+ Add Product
		</a>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	{#if form?.deleted}
		<div class="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
			Product deleted successfully.
		</div>
	{/if}

	<div class="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th
						scope="col"
						class="py-3.5 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6">Image</th
					>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Name</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark sm:table-cell">Price</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark md:table-cell">Status</th
					>
					<th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-6">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if products.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-600">
							No products yet. Click "+ Add Product" to get started.
						</td>
					</tr>
				{:else}
					{#each products as product (product.id)}
						<tr class="transition-colors hover:bg-brand-bg/50">
							<td class="py-4 pr-3 pl-4 whitespace-nowrap sm:pl-6">
								<div
									class="h-12 w-12 overflow-hidden rounded-lg border border-brand-light bg-brand-bg sm:h-16 sm:w-16"
								>
									{#if product.image_url && product.image_url.length > 0}
										<img
											src={product.image_url[0]}
											alt={product.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xs text-brand-mid"
										>
											No img
										</div>
									{/if}
								</div>
							</td>
							<td class="px-3 py-4 text-sm font-bold text-brand-dark">
								<div class="max-w-[150px] truncate sm:max-w-none">{product.name}</div>
								<div class="mt-1 text-xs font-medium text-brand-brown sm:hidden">
									${Number(product.price).toFixed(2)}
								</div>
								{#if product.in_stock}
									<span
										class="mt-1 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset md:hidden"
										>In Stock</span
									>
								{:else}
									<span
										class="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset md:hidden"
										>Sold</span
									>
								{/if}
							</td>
							<td class="hidden px-3 py-4 text-sm font-medium whitespace-nowrap text-brand-brown sm:table-cell"
								>${Number(product.price).toFixed(2)}</td
							>
							<td class="hidden px-3 py-4 text-sm whitespace-nowrap md:table-cell">
								{#if product.in_stock}
									<span
										class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset"
										>In Stock</span
									>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset"
										>Sold</span
									>
								{/if}
							</td>
							<td
								class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6"
							>
								<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
									<a
										href="/admin/edit/{product.id}"
										class="cursor-pointer text-brand-mid hover:text-brand-dark">Edit</a
									>
									<form method="POST" action="?/delete" class="inline">
										<input type="hidden" name="id" value={product.id} />
										<input type="hidden" name="image_urls" value={JSON.stringify(product.image_url ?? [])} />
										<button
											type="submit"
											class="cursor-pointer text-brand-brown transition-colors hover:text-brand-dark"
											onclick={(e) => {
												if (!confirm(`Delete "${product.name}"?`)) e.preventDefault();
											}}
										>
											Delete<span class="sr-only">, {product.name}</span>
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if products.length > 0}
		<p class="mt-3 text-sm text-gray-600">
			{products.length} product{products.length === 1 ? '' : 's'} total
		</p>
	{/if}
</div>
