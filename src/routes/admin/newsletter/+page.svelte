<!-- Admin Newsletter Subscribers -->
<script>
	import Pagination from '$lib/components/ui/Pagination.svelte';

	let { data } = $props();

	/** @type {any[]} */
	let subscribers = $derived(data.subscribers ?? []);
	let page = $derived(/** @type {any} */ (data).page ?? 1);
	let totalPages = $derived(/** @type {any} */ (data).totalPages ?? 1);
	let totalCount = $derived(/** @type {any} */ (data).totalCount ?? 0);
	let fromIndex = $derived(/** @type {any} */ (data).from ?? 0);
	let toIndex = $derived(/** @type {any} */ (data).to ?? 0);

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
	<title>Newsletter | Admin | Henry's Liquidation Store</title>
</svelte:head>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Newsletter Subscribers</h1>
		<a
			href="/admin/newsletter/export"
			class="inline-flex items-center justify-center rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-mid"
		>
			Download CSV
		</a>
	</div>

	<div class="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6">Email</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Source</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Signed Up</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if subscribers.length === 0}
					<tr>
						<td colspan="3" class="px-4 py-8 text-center text-sm text-gray-600">
							No subscribers yet.
						</td>
					</tr>
				{:else}
					{#each subscribers as subscriber (subscriber.id)}
						<tr class="transition-colors hover:bg-brand-bg/50">
							<td class="py-4 pr-3 pl-4 text-sm font-medium text-brand-dark sm:pl-6">
								{subscriber.email}
							</td>
							<td class="px-3 py-4 text-sm text-gray-600">
								{subscriber.source ?? '—'}
							</td>
							<td class="px-3 py-4 text-sm text-gray-600">
								{formatDate(subscriber.created_at)}
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
				of <span class="font-medium text-brand-dark">{totalCount}</span> subscribers
			</p>
			<Pagination {page} {totalPages} makeHref={(p) => `/admin/newsletter?page=${p}`} />
		</div>
	{/if}
</div>
