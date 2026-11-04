<!-- Admin Orders -->
<script>
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data } = $props();

	/** @type {any[]} */
	let orders = $derived(data.orders ?? []);
	let page = $derived(/** @type {any} */ (data).page ?? 1);
	let totalPages = $derived(/** @type {any} */ (data).totalPages ?? 1);
	let totalCount = $derived(/** @type {any} */ (data).totalCount ?? 0);
	let fromIndex = $derived(/** @type {any} */ (data).from ?? 0);
	let toIndex = $derived(/** @type {any} */ (data).to ?? 0);

	/** @param {any[]} items */
	function orderTotal(items) {
		return (items ?? []).reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
	}

	/** @param {string} dateStr */
	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Orders | Admin | Henry's Liquidation Store</title>
</svelte:head>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-2xl font-bold text-brand-dark">Orders</h1>

	<div class="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6">Date</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Customer</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark sm:table-cell">Items</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Total</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark md:table-cell">Fulfillment</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Status</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if orders.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-sm text-gray-600">
							No orders yet.
						</td>
					</tr>
				{:else}
					{#each orders as order (order.id)}
						<tr
							class="cursor-pointer transition-colors hover:bg-brand-bg/50"
							onclick={() => goto(`/admin/orders/${order.id}`)}
						>
							<td class="py-4 pr-3 pl-4 text-sm text-gray-600 sm:pl-6">
								{formatDate(order.created_at)}
							</td>
							<td class="px-3 py-4 text-sm font-medium text-brand-dark">
								<div class="max-w-[160px] truncate">{order.customer_email}</div>
							</td>
							<td class="hidden px-3 py-4 text-sm text-gray-600 sm:table-cell">
								{(order.items ?? []).length}
							</td>
							<td class="px-3 py-4 text-sm font-medium text-brand-brown">
								${orderTotal(order.items).toFixed(2)}
							</td>
							<td class="hidden px-3 py-4 text-sm md:table-cell">
								{#if order.fulfillment_method}
									<Badge
										tone={order.fulfillment_method === 'ship' ? 'admin-in-stock' : 'neutral'}
										pill
										uppercase={false}
									>
										{order.fulfillment_method === 'ship' ? 'Ship' : 'Pickup'}
									</Badge>
								{:else}
									<span class="text-gray-400">—</span>
								{/if}
							</td>
							<td class="px-3 py-4 text-sm">
								<Badge
									tone={order.payment_status === 'paid' ? 'admin-in-stock' : 'admin-sold'}
									pill
									uppercase={false}
								>
									{order.payment_status}
								</Badge>
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
				of <span class="font-medium text-brand-dark">{totalCount}</span> orders
			</p>
			<Pagination {page} {totalPages} makeHref={(p) => `/admin/orders?page=${p}`} />
		</div>
	{/if}
</div>
