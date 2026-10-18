<!-- Admin Dashboard -->
<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data, form } = $props();

	/** @type {any[]} */
	let products = $derived(/** @type {any} */ (data).products ?? []);
	let page = $derived(/** @type {any} */ (data).page ?? 1);
	let totalPages = $derived(/** @type {any} */ (data).totalPages ?? 1);
	let totalCount = $derived(/** @type {any} */ (data).totalCount ?? 0);
	let fromIndex = $derived(/** @type {any} */ (data).from ?? 0);
	let toIndex = $derived(/** @type {any} */ (data).to ?? 0);
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
						<tr 
							class="cursor-pointer transition-colors hover:bg-brand-bg/50"
							onclick={() => goto(`/admin/edit/${product.id}`)}
						>
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
								<div class="mt-1 md:hidden">
									<Badge tone={product.in_stock ? 'admin-in-stock' : 'admin-sold'} pill uppercase={false}>
										{product.in_stock ? 'In Stock' : 'Sold'}
									</Badge>
								</div>
							</td>
							<td class="hidden px-3 py-4 text-sm font-medium whitespace-nowrap text-brand-brown sm:table-cell"
								>${Number(product.price).toFixed(2)}</td
							>
							<td class="hidden px-3 py-4 text-sm whitespace-nowrap md:table-cell">
								<Badge tone={product.in_stock ? 'admin-in-stock' : 'admin-sold'} pill uppercase={false}>
									{product.in_stock ? 'In Stock' : 'Sold'}
								</Badge>
							</td>
							<td
								class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6"
							>
								<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
									<a
										href="/admin/edit/{product.id}"
										class="cursor-pointer text-brand-mid hover:text-brand-dark"
										onclick={(e) => e.stopPropagation()}
									>Edit</a>
									<form method="POST" action="?/delete" class="inline" use:enhance>
										<input type="hidden" name="id" value={product.id} />
										<input type="hidden" name="image_urls" value={JSON.stringify(product.image_url ?? [])} />
										<button
											type="submit"
											class="cursor-pointer text-brand-brown transition-colors hover:text-brand-dark"
											onclick={(e) => {
												e.stopPropagation();
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

	{#if totalCount > 0}
		<div class="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
			<p class="text-sm text-brand-mid">
				Showing <span class="font-medium text-brand-dark">{fromIndex + 1}</span>–<span
					class="font-medium text-brand-dark">{toIndex + 1}</span
				>
				of <span class="font-medium text-brand-dark">{totalCount}</span> products
			</p>
			<Pagination {page} {totalPages} makeHref={(p) => `/admin?page=${p}`} />
		</div>
	{/if}
</div>
