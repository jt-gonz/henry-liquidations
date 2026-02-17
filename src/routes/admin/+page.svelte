<!-- Admin Dashboard -->
<script>
	let { data, form } = $props();
</script>

<div>
	<!-- ── Product Inventory ──────────────────────────────────── -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Product Inventory</h1>
		<a
			href="/admin/add"
			class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
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

	<div class="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
		<table class="min-w-full divide-y divide-gray-300">
			<thead class="bg-gray-50">
				<tr>
					<th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Image</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
					<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if data.products.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">
							No products yet. Click "+ Add Product" to get started.
						</td>
					</tr>
				{:else}
					{#each data.products as product (product.id)}
						<tr class="hover:bg-gray-50/50 transition-colors">
							<td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
								<div class="h-16 w-16 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
									{#if product.image_url}
										<img
											src={product.image_url}
											alt={product.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center text-xs text-gray-400">
											No img
										</div>
									{/if}
								</div>
							</td>
							<td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{product.name}</td>
							<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${Number(product.price).toFixed(2)}</td>
							<td class="whitespace-nowrap px-3 py-4 text-sm">
								{#if product.in_stock}
									<span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">In Stock</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Sold</span>
								{/if}
							</td>
							<td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
								<a href="/admin/edit/{product.id}" class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</a>
								<form method="POST" action="?/delete" class="inline">
									<input type="hidden" name="id" value={product.id} />
									<input type="hidden" name="image_url" value={product.image_url} />
									<button
										type="submit"
										class="text-red-600 hover:text-red-900 transition-colors"
										onclick={(e) => {
											if (!confirm(`Delete "${product.name}"?`)) e.preventDefault();
										}}
									>
										Delete<span class="sr-only">, {product.name}</span>
									</button>
								</form>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if data.products.length > 0}
		<p class="mt-3 text-sm text-gray-500">
			{data.products.length} product{data.products.length === 1 ? '' : 's'} total
		</p>
	{/if}
</div>

