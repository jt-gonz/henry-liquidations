<!-- Add Product Page -->
<script>
	let { form } = $props();
	let submitting = $state(false);

	/** @type {string[]} */
	let colors = $state([]);
	let newColor = $state('#000000');

	function addColor() {
		if (newColor && !colors.includes(newColor)) {
			colors = [...colors, newColor];
		}
	}

	function removeColor(/** @type {string} */ color) {
		colors = colors.filter((c) => c !== color);
	}
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="mb-6 text-2xl font-bold text-center text-gray-900">Add New Product</h1>

	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		class="space-y-6"
		onsubmit={() => {
			submitting = true;
		}}
	>
		<!-- Row 1: Name -->
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700">Product Name</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				value={form?.name ?? ''}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
			/>
		</div>

		<!-- Row 2: Price + Category (side by side) -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="price" class="block text-sm font-medium text-gray-700">Price ($)</label>
				<input
					id="price"
					name="price"
					type="number"
					step="0.01"
					min="0"
					required
					value={form?.price ?? ''}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="category" class="block text-sm font-medium text-gray-700">Category</label>
				<select
					id="category"
					name="category"
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
				>
					<option value="">Select</option>
					<option value="Living Room" selected={form?.category === 'Living Room'}>Living Room</option>
					<option value="Bedroom" selected={form?.category === 'Bedroom'}>Bedroom</option>
					<option value="Dining" selected={form?.category === 'Dining'}>Dining</option>
					<option value="Office" selected={form?.category === 'Office'}>Office</option>
					<option value="Outdoor" selected={form?.category === 'Outdoor'}>Outdoor</option>
					<option value="Other" selected={form?.category === 'Other'}>Other</option>
				</select>
			</div>
		</div>

		<!-- Row 3: Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
				>{form?.description ?? ''}</textarea
			>
		</div>

		<!-- Row 4: Dimensions -->
		<fieldset class="rounded-md border border-gray-200 p-4">
			<legend class="text-sm font-medium text-gray-700 px-1">Dimensions (optional)</legend>
			<div class="grid grid-cols-4 gap-4 mt-2">
				<div>
					<label for="dim_width" class="block text-xs text-gray-500 mb-1">Width</label>
					<input id="dim_width" name="dim_width" type="number" step="0.1" min="0" class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm" />
				</div>
				<div>
					<label for="dim_height" class="block text-xs text-gray-500 mb-1">Height</label>
					<input id="dim_height" name="dim_height" type="number" step="0.1" min="0" class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm" />
				</div>
				<div>
					<label for="dim_depth" class="block text-xs text-gray-500 mb-1">Depth</label>
					<input id="dim_depth" name="dim_depth" type="number" step="0.1" min="0" class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm" />
				</div>
				<div>
					<label for="dim_unit" class="block text-xs text-gray-500 mb-1">Unit</label>
					<select id="dim_unit" name="dim_unit" class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm">
						<option value="in">inches</option>
						<option value="cm">cm</option>
						<option value="ft">feet</option>
					</select>
				</div>
			</div>
		</fieldset>

		<!-- Row 5: Colors -->
		<fieldset class="rounded-md border border-gray-200 p-4">
				<legend class="text-xs font-medium text-gray-700 px-1">Colors (optional)</legend>
				<div class="flex items-center gap-2 mt-1">
					<input
						type="color"
						bind:value={newColor}
						class="h-8 w-8 cursor-pointer rounded border border-gray-300"
					/>
					<button
						type="button"
						onclick={addColor}
						class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
					>
						Add
					</button>
				</div>
				{#if colors.length > 0}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each colors as color (color)}
							<button
								type="button"
								onclick={() => removeColor(color)}
								class="group relative h-6 w-6 rounded-full ring-1 ring-gray-300 hover:ring-red-400 transition-all"
								style="background-color: {color}"
								title="Click to remove {color}"
							>
								<span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-xs font-bold drop-shadow-md">✕</span>
							</button>
						{/each}
					</div>
				{/if}
				<!-- Hidden inputs for form submission -->
				<input type="hidden" name="colors" value={JSON.stringify(colors)} />
			</fieldset>

		<!-- Row 6: Image -->
		<div>
			<label for="image" class="block text-sm font-medium text-gray-700">Product Image</label>
			<input
				id="image"
				name="image"
				type="file"
				accept="image/*"
				required
				class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
			/>
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{submitting ? 'Saving...' : 'Save Product'}
		</button>
	</form>
</div>
