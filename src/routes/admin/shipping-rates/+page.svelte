<!-- Admin Shipping Rates Management -->
<script>
	let { data, form } = $props();

	/** @type {any[]} */
	let rates = $derived(data.rates ?? []);

	// State for add/edit modal
	let showModal = $state(false);
	/** @type {any | null} */
	let editingRate = $state(null);
	let newLabel = $state('');
	let newZipStart = $state('');
	let newZipEnd = $state('');
	let newFee = $state(0);
	let newSortOrder = $state(0);
	let newIsActive = $state(true);
	let newIsFallback = $state(false);

	function openAddModal() {
		editingRate = null;
		newLabel = '';
		newZipStart = '';
		newZipEnd = '';
		newFee = 0;
		newSortOrder = rates.length;
		newIsActive = true;
		newIsFallback = false;
		showModal = true;
	}

	/** @param {any} rate */
	function openEditModal(rate) {
		editingRate = rate;
		newLabel = rate.label;
		newZipStart = rate.zip_start ?? '';
		newZipEnd = rate.zip_end ?? '';
		newFee = rate.fee;
		newSortOrder = rate.sort_order;
		newIsActive = rate.is_active;
		newIsFallback = rate.is_fallback;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingRate = null;
	}

	/** @param {string} zip */
	function formatZip(zip) {
		return zip ? String(zip).padStart(5, '0') : '';
	}
</script>

<svelte:head>
	<title>Shipping Rates | Admin | Henry's Liquidation Store</title>
</svelte:head>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Shipping Rates</h1>
		<button
			onclick={openAddModal}
			class="inline-flex items-center justify-center rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-mid"
		>
			+ Add Shipping Rate
		</button>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
			{form.success}
		</div>
	{/if}

	<div class="overflow-x-auto rounded-lg bg-white shadow ring-1 ring-brand-light/50">
		<table class="min-w-full divide-y divide-brand-light">
			<thead class="bg-brand-bg">
				<tr>
					<th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6">Label</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark sm:table-cell">ZIP Range</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Fee</th>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark md:table-cell">Sort Order</th>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Status</th>
					<th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-6">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if rates.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-sm text-gray-600">
							No shipping rates yet. Click "+ Add Shipping Rate" to get started.
						</td>
					</tr>
				{:else}
					{#each rates.sort((a, b) => a.sort_order - b.sort_order) as rate (rate.id)}
						<tr class="transition-colors hover:bg-brand-bg/50">
							<td class="py-4 pr-3 pl-4 text-sm font-bold text-brand-dark sm:pl-6">
								{rate.label}
								<div class="mt-1 text-xs text-gray-500 sm:hidden">
									{rate.is_fallback ? 'Fallback (everywhere else)' : `${formatZip(rate.zip_start)}–${formatZip(rate.zip_end)}`}
								</div>
							</td>
							<td class="hidden px-3 py-4 font-mono text-xs text-gray-600 sm:table-cell">
								{rate.is_fallback ? '— (fallback)' : `${formatZip(rate.zip_start)}–${formatZip(rate.zip_end)}`}
							</td>
							<td class="px-3 py-4 text-sm font-medium text-brand-brown">
								${Number(rate.fee).toFixed(2)}
							</td>
							<td class="hidden px-3 py-4 text-sm text-gray-600 md:table-cell">
								{rate.sort_order}
							</td>
							<td class="px-3 py-4 text-sm">
								{#if rate.is_active}
									<span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">Active</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">Inactive</span>
								{/if}
							</td>
							<td class="relative py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6">
								<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
									<button
										onclick={() => openEditModal(rate)}
										class="cursor-pointer text-brand-mid hover:text-brand-dark"
									>
										Edit
									</button>
									<form method="POST" action="?/delete" class="inline">
										<input type="hidden" name="id" value={rate.id} />
										<button
											type="submit"
											class="cursor-pointer text-brand-brown transition-colors hover:text-brand-dark"
											onclick={(e) => {
												if (!confirm(`Delete shipping rate "${rate.label}"?`)) e.preventDefault();
											}}
										>
											Delete
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

	<p class="mt-4 text-sm text-gray-500">
		<strong>Note:</strong> Ranges are checked in Sort Order (lowest first) — the first range a ZIP falls
		into wins, so put more specific ranges before broader ones. The "fallback" rate applies to any ZIP
		not covered by another active range; only one fallback rate can be active at a time.
	</p>
</div>

<!-- Add/Edit Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={closeModal}></div>

		<div class="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:p-0">
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

			<div class="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
				<form method="POST" action={editingRate ? '?/update' : '?/create'}>
					{#if editingRate}
						<input type="hidden" name="id" value={editingRate.id} />
					{/if}

					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
							{editingRate ? 'Edit Shipping Rate' : 'Add New Shipping Rate'}
						</h3>

						<div class="mt-4 space-y-4">
							<div>
								<label for="label" class="block text-sm font-medium text-gray-700">Label</label>
								<input
									type="text"
									name="label"
									id="label"
									bind:value={newLabel}
									placeholder="e.g., Local (Tippecanoe Co.)"
									required
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
								/>
							</div>

							<div class="flex items-center">
								<input
									type="checkbox"
									name="is_fallback"
									id="is_fallback"
									bind:checked={newIsFallback}
									class="h-4 w-4 rounded border-gray-300 text-brand-dark focus:ring-brand-mid"
								/>
								<label for="is_fallback" class="ml-2 block text-sm text-gray-700">
									Fallback rate (applies to any ZIP not covered above)
								</label>
							</div>

							{#if !newIsFallback}
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label for="zip_start" class="block text-sm font-medium text-gray-700">Start ZIP</label>
										<input
											type="text"
											name="zip_start"
											id="zip_start"
											bind:value={newZipStart}
											inputmode="numeric"
											pattern="[0-9]{5}"
											maxlength="5"
											placeholder="47900"
											required={!newIsFallback}
											class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
										/>
									</div>
									<div>
										<label for="zip_end" class="block text-sm font-medium text-gray-700">End ZIP</label>
										<input
											type="text"
											name="zip_end"
											id="zip_end"
											bind:value={newZipEnd}
											inputmode="numeric"
											pattern="[0-9]{5}"
											maxlength="5"
											placeholder="47999"
											required={!newIsFallback}
											class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
										/>
									</div>
								</div>
							{/if}

							<div>
								<label for="fee" class="block text-sm font-medium text-gray-700">Fee ($)</label>
								<input
									type="number"
									name="fee"
									id="fee"
									bind:value={newFee}
									min="0"
									step="0.01"
									required
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
								/>
							</div>

							<div>
								<label for="sort_order" class="block text-sm font-medium text-gray-700">
									Sort Order
									<span class="text-xs text-gray-500">(Lower numbers checked first)</span>
								</label>
								<input
									type="number"
									name="sort_order"
									id="sort_order"
									bind:value={newSortOrder}
									min="0"
									required
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
								/>
							</div>

							<div class="flex items-center">
								<input
									type="checkbox"
									name="is_active"
									id="is_active"
									bind:checked={newIsActive}
									class="h-4 w-4 rounded border-gray-300 text-brand-dark focus:ring-brand-mid"
								/>
								<label for="is_active" class="ml-2 block text-sm text-gray-700">Active</label>
							</div>
						</div>
					</div>

					<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
						<button
							type="submit"
							class="inline-flex w-full justify-center rounded-md bg-brand-dark px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-mid sm:ml-3 sm:w-auto"
						>
							{editingRate ? 'Save Changes' : 'Add Shipping Rate'}
						</button>
						<button
							type="button"
							onclick={closeModal}
							class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
