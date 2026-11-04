<!-- Admin Order Detail -->
<script>
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();

	let order = $derived(data.order);
	let items = $derived(order.items ?? []);
	let itemsTotal = $derived(
		items.reduce(
			(/** @type {number} */ sum, /** @type {any} */ item) =>
				sum + Number(item.price) * Number(item.quantity),
			0
		)
	);
	let grandTotal = $derived(itemsTotal + Number(order.shipping_fee ?? 0));

	/** @param {string} dateStr */
	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Order Details | Admin | Henry's Liquidation Store</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<a href="/admin/orders" class="text-sm text-brand-mid hover:text-brand-dark">&larr; Orders</a>
			<h1 class="mt-1 text-2xl font-bold text-brand-dark">Order Detail</h1>
		</div>
		<Badge tone={order.payment_status === 'paid' ? 'admin-in-stock' : 'admin-sold'} pill uppercase={false}>
			{order.payment_status}
		</Badge>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold tracking-wide text-brand-mid uppercase">Customer</h2>
			<p class="mt-2 text-sm text-brand-dark">{order.customer_email}</p>
			<p class="mt-1 text-xs text-gray-500">Ordered {formatDate(order.created_at)}</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold tracking-wide text-brand-mid uppercase">Fulfillment</h2>
			<p class="mt-2 text-sm text-brand-dark">
				{order.fulfillment_method === 'ship'
					? 'Ship'
					: order.fulfillment_method === 'pickup'
						? 'Pick up in store'
						: '—'}
			</p>
			{#if order.fulfillment_method === 'ship'}
				<p class="mt-1 text-xs text-gray-500">ZIP: {order.shipping_zip ?? '—'}</p>
				<p class="mt-1 text-xs text-gray-500">
					Shipping fee: ${Number(order.shipping_fee ?? 0).toFixed(2)}
				</p>
			{/if}
		</div>
	</div>

	{#if order.shipping_address}
		<div class="mt-6 rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold tracking-wide text-brand-mid uppercase">Shipping Address</h2>
			<div class="mt-2 text-sm text-brand-dark">
				{#if order.shipping_address.name}
					<p>{order.shipping_address.name}</p>
				{/if}
				{#if order.shipping_address.address}
					<p>{order.shipping_address.address.line1}</p>
					{#if order.shipping_address.address.line2}
						<p>{order.shipping_address.address.line2}</p>
					{/if}
					<p>
						{order.shipping_address.address.city}, {order.shipping_address.address.state}
						{order.shipping_address.address.postal_code}
					</p>
					<p>{order.shipping_address.address.country}</p>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-6 overflow-hidden rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th scope="col" class="py-3 pr-3 pl-4 text-left text-sm font-bold text-brand-dark">Item</th>
					<th scope="col" class="px-3 py-3 text-right text-sm font-bold text-brand-dark">Price</th>
					<th scope="col" class="px-3 py-3 text-right text-sm font-bold text-brand-dark">Qty</th>
					<th scope="col" class="py-3 pr-4 pl-3 text-right text-sm font-bold text-brand-dark">Line Total</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light">
				{#each items as item}
					<tr>
						<td class="py-3 pr-3 pl-4 text-sm text-brand-dark">{item.name}</td>
						<td class="px-3 py-3 text-right text-sm text-gray-600">${Number(item.price).toFixed(2)}</td>
						<td class="px-3 py-3 text-right text-sm text-gray-600">{item.quantity}</td>
						<td class="py-3 pr-4 pl-3 text-right text-sm font-medium text-brand-dark">
							${(Number(item.price) * Number(item.quantity)).toFixed(2)}
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot class="bg-brand-bg">
				{#if order.fulfillment_method === 'ship' && order.shipping_fee}
					<tr>
						<td colspan="3" class="py-2 pr-3 pl-4 text-right text-sm text-gray-600">Subtotal</td>
						<td class="py-2 pr-4 pl-3 text-right text-sm text-gray-600">${itemsTotal.toFixed(2)}</td>
					</tr>
					<tr>
						<td colspan="3" class="py-2 pr-3 pl-4 text-right text-sm text-gray-600">Shipping</td>
						<td class="py-2 pr-4 pl-3 text-right text-sm text-gray-600">
							${Number(order.shipping_fee).toFixed(2)}
						</td>
					</tr>
				{/if}
				<tr>
					<td colspan="3" class="py-3 pr-3 pl-4 text-right text-sm font-bold text-brand-dark">Total</td>
					<td class="py-3 pr-4 pl-3 text-right text-sm font-bold text-brand-brown">
						${grandTotal.toFixed(2)}
					</td>
				</tr>
			</tfoot>
		</table>
	</div>

	<p class="mt-4 text-xs text-gray-400">Stripe session: {order.stripe_session_id}</p>
</div>
