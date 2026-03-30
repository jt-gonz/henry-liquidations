<!-- Admin Categories Management -->
<script>
	let { data, form } = $props();

	/** @type {any[]} */
	let categories = $derived(data.categories ?? []);

	// State for add/edit modal
	let showModal = $state(false);
	/** @type {{ id: string, value: string, label: string, sort_order: number, is_active: boolean } | null} */
	let editingCategory = $state(null);
	let newValue = $state('');
	let newLabel = $state('');
	let newSortOrder = $state(0);
	let newIsActive = $state(true);

	function openAddModal() {
		editingCategory = null;
		newValue = '';
		newLabel = '';
		newSortOrder = categories.length;
		newIsActive = true;
		showModal = true;
	}

	/**
	 * @param {any} category
	 */
	function openEditModal(category) {
		editingCategory = category;
		newValue = category.value;
		newLabel = category.label;
		newSortOrder = category.sort_order;
		newIsActive = category.is_active;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingCategory = null;
	}

	/**
	 * @param {string} value
	 */
	function generateLabel(value) {
		// Convert "LIVING ROOM COLLECTION" to "Living Room Collection"
		return value
			.toLowerCase()
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Auto-generate label from value
	$effect(() => {
		if (!editingCategory && newValue && !newLabel) {
			newLabel = generateLabel(newValue);
		}
	});
</script>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Categories</h1>
		<button
			onclick={openAddModal}
			class="inline-flex items-center justify-center rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand-mid"
		>
			+ Add Category
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
					<th
						scope="col"
						class="py-3.5 pr-3 pl-4 text-left text-sm font-bold text-brand-dark sm:pl-6"
						>Display Name</th
					>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark md:table-cell"
						>Database Value</th
					>
					<th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-bold text-brand-dark sm:table-cell"
						>Sort Order</th
					>
					<th scope="col" class="px-3 py-3.5 text-left text-sm font-bold text-brand-dark">Status</th
					>
					<th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-6">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-brand-light bg-white">
				{#if categories.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-600">
							No categories yet. Click "+ Add Category" to get started.
						</td>
					</tr>
				{:else}
					{#each categories.sort((a, b) => a.sort_order - b.sort_order) as category (category.id)}
						<tr class="transition-colors hover:bg-brand-bg/50">
							<td
								class="py-4 pr-3 pl-4 text-sm font-bold text-brand-dark sm:pl-6"
							>
								{category.label}
								<div class="mt-1 text-xs text-gray-500 md:hidden">
									{category.value}
								</div>
							</td>
							<td class="hidden px-3 py-4 font-mono text-sm text-xs text-gray-600 md:table-cell">
								{category.value}
							</td>
							<td class="hidden px-3 py-4 text-sm text-gray-600 sm:table-cell">
								{category.sort_order}
							</td>
							<td class="px-3 py-4 text-sm">
								{#if category.is_active}
									<span
										class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset"
										>Active</span
									>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset"
										>Inactive</span
									>
								{/if}
							</td>
							<td
								class="relative py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6"
							>
								<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
									<button
										onclick={() => openEditModal(category)}
										class="cursor-pointer text-brand-mid hover:text-brand-dark"
									>
										Edit
									</button>
									<form method="POST" action="?/delete" class="inline">
										<input type="hidden" name="id" value={category.id} />
										<button
											type="submit"
											class="cursor-pointer text-brand-brown transition-colors hover:text-brand-dark"
											onclick={(e) => {
												if (
													!confirm(
														`Delete category "${category.label}"?\n\nNote: Products using this category will keep the category value but won't be filterable.`
													)
												) {
													e.preventDefault();
												}
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
		<strong>Note:</strong> Categories are sorted by "Sort Order" (lower numbers appear first). Inactive
		categories are hidden from the shop filter but existing products keep their category.
	</p>
</div>

<!-- Add/Edit Modal -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<!-- Background overlay -->
		<div
			class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
			aria-hidden="true"
			onclick={closeModal}
		></div>

		<div class="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:p-0">
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
				>&#8203;</span
			>

			<!-- Modal panel -->
			<div
				class="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
			>
				<form method="POST" action={editingCategory ? '?/update' : '?/create'}>
					{#if editingCategory}
						<input type="hidden" name="id" value={editingCategory.id} />
					{/if}

					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
							{editingCategory ? 'Edit Category' : 'Add New Category'}
						</h3>

						<div class="mt-4 space-y-4">
							<!-- Database Value -->
							<div>
								<label for="value" class="block text-sm font-medium text-gray-700">
									Database Value
									<span class="text-xs text-gray-500">(UPPER_CASE format)</span>
								</label>
								<input
									type="text"
									name="value"
									id="value"
									bind:value={newValue}
									disabled={!!editingCategory}
									placeholder="e.g., DINING COLLECTION"
									required
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
								/>
								{#if !editingCategory}
									<p class="mt-1 text-xs text-gray-500">
										This value is stored in the database and should match your CSV category names
										exactly.
									</p>
								{/if}
							</div>

							<!-- Display Label -->
							<div>
								<label for="label" class="block text-sm font-medium text-gray-700">
									Display Label
									<span class="text-xs text-gray-500">(Shown to customers)</span>
								</label>
								<input
									type="text"
									name="label"
									id="label"
									bind:value={newLabel}
									placeholder="e.g., Dining Collection"
									required
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
								/>
							</div>

							<!-- Sort Order -->
							<div>
								<label for="sort_order" class="block text-sm font-medium text-gray-700">
									Sort Order
									<span class="text-xs text-gray-500">(Lower numbers appear first)</span>
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

							<!-- Active Status -->
							<div class="flex items-center">
								<input
									type="checkbox"
									name="is_active"
									id="is_active"
									bind:checked={newIsActive}
									class="h-4 w-4 rounded border-gray-300 text-brand-dark focus:ring-brand-mid"
								/>
								<label for="is_active" class="ml-2 block text-sm text-gray-700">
									Active (visible in shop filter)
								</label>
							</div>
						</div>
					</div>

					<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
						<button
							type="submit"
							class="inline-flex w-full justify-center rounded-md bg-brand-dark px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-mid sm:ml-3 sm:w-auto"
						>
							{editingCategory ? 'Save Changes' : 'Add Category'}
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
