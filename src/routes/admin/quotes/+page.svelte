<!-- Admin: Manage Quotes -->
<script>
	let { data, form } = $props();
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Customer Quotes</h1>

	{#if form?.quoteError}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.quoteError}
		</div>
	{/if}

	{#if form?.quoteAdded}
		<div class="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
			Quote added successfully.
		</div>
	{/if}

	{#if form?.quoteDeleted}
		<div class="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
			Quote deleted successfully.
		</div>
	{/if}

	<!-- Add Quote Form -->
	<form method="POST" action="?/addQuote" class="mb-8 rounded-lg bg-gray-50 p-6 ring-1 ring-gray-200">
		<h2 class="text-sm font-semibold text-gray-900 mb-4">Add New Quote</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label for="quote" class="block text-sm font-medium text-gray-700">Quote</label>
				<textarea
					id="quote"
					name="quote"
					rows="2"
					required
					placeholder="Great quality furniture at amazing prices!"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
				></textarea>
			</div>
			<div>
				<label for="reviewer" class="block text-sm font-medium text-gray-700">Reviewer Name</label>
				<input
					id="reviewer"
					name="reviewer"
					type="text"
					required
					placeholder="Jane D."
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div class="flex items-end">
				<button
					type="submit"
					class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
				>
					Add Quote
				</button>
			</div>
		</div>
	</form>

	<!-- Existing Quotes -->
	{#if data.quotes.length === 0}
		<p class="text-sm text-gray-500">No quotes yet. Add one above.</p>
	{:else}
		<div class="space-y-3">
			{#each data.quotes as q (q.id)}
				<div class="flex items-start justify-between rounded-lg bg-white p-4 ring-1 ring-gray-200">
					<div class="min-w-0 flex-1">
						<p class="text-sm text-gray-700">"{q.quote}"</p>
						<p class="mt-1 text-xs text-gray-500">— {q.reviewer}</p>
					</div>
					<form method="POST" action="?/deleteQuote" class="ml-4 shrink-0">
						<input type="hidden" name="id" value={q.id} />
						<button
							type="submit"
							class="text-xs text-red-600 hover:text-red-800"
							onclick={(e) => {
								if (!confirm('Delete this quote?')) e.preventDefault();
							}}
						>
							Delete
						</button>
					</form>
				</div>
			{/each}
		</div>
		<p class="mt-4 text-sm text-gray-400">{data.quotes.length} quote{data.quotes.length === 1 ? '' : 's'} total</p>
	{/if}
</div>
