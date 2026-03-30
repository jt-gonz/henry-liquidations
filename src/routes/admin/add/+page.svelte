<!-- Add Product Page -->
<script>
	let { data, form } = $props();
	/** @type {{ id: string, value: string, label: string, sort_order: number, is_active: boolean }[]} */
	let categories = $derived(/** @type {any} */ (data).categories ?? []);
	let submitting = $state(false);

	/** @type {string[]} */
	let colors = $state([]);
	let newColor = $state('#000000');

	/** @type {File[]} */
	let selectedImages = $state([]);
	/** @type {string[]} */
	let previewUrls = $state([]);

	function addColor() {
		if (newColor && !colors.includes(newColor)) {
			colors = [...colors, newColor];
		}
	}

	function removeColor(/** @type {string} */ color) {
		colors = colors.filter((c) => c !== color);
	}

	/**
	 * @param {Event} e
	 */
	function handleImageSelect(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		if (input.files && input.files.length > 0) {
			const newFiles = Array.from(input.files);
			selectedImages = [...selectedImages, ...newFiles];
			
			// Generate preview URLs (client-side only)
			if (typeof window !== 'undefined') {
				newFiles.forEach((file) => {
					const url = URL.createObjectURL(file);
					previewUrls = [...previewUrls, url];
				});
			}
		}
	}

	/**
	 * @param {number} index
	 */
	function removeImage(index) {
		// Revoke the preview URL to free memory
		if (typeof window !== 'undefined') {
			URL.revokeObjectURL(previewUrls[index]);
		}
		
		selectedImages = selectedImages.filter((_, i) => i !== index);
		previewUrls = previewUrls.filter((_, i) => i !== index);
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-center text-2xl font-bold text-gray-900">Add New Product</h1>

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
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
					<option value="">Select Category</option>
					{#each categories as cat}
						<option value={cat.value} selected={form?.category === cat.value}>{cat.label}</option>
					{/each}
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
			<legend class="px-1 text-sm font-medium text-gray-700">Dimensions (optional)</legend>
			<div class="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<label for="dim_width" class="mb-1 block text-xs text-gray-500">Width</label>
					<input
						id="dim_width"
						name="dim_width"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_height" class="mb-1 block text-xs text-gray-500">Height</label>
					<input
						id="dim_height"
						name="dim_height"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_depth" class="mb-1 block text-xs text-gray-500">Depth</label>
					<input
						id="dim_depth"
						name="dim_depth"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_unit" class="mb-1 block text-xs text-gray-500">Unit</label>
					<select
						id="dim_unit"
						name="dim_unit"
						class="block w-full rounded-md border border-gray-300 px-2 py-1.5 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
					>
						<option value="in">inches</option>
						<option value="cm">cm</option>
						<option value="ft">feet</option>
					</select>
				</div>
			</div>
		</fieldset>

		<!-- Row 5: Colors -->
		<fieldset class="rounded-md border border-gray-200 p-4">
			<legend class="px-1 text-xs font-medium text-gray-700">Colors (optional)</legend>
			<div class="mt-1 flex items-center gap-2">
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
							class="group relative h-6 w-6 rounded-full ring-1 ring-gray-300 transition-all hover:ring-red-400"
							style="background-color: {color}"
							title="Click to remove {color}"
						>
							<span
								class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 drop-shadow-md group-hover:opacity-100"
								>✕</span
							>
						</button>
					{/each}
				</div>
			{/if}
			<!-- Hidden inputs for form submission -->
			<input type="hidden" name="colors" value={JSON.stringify(colors)} />
		</fieldset>

		<!-- Row 6: Images (Multiple) -->
		<div>
			<label for="images" class="block text-sm font-medium text-gray-700">Product Images</label>
			<input
				id="images"
				name="images"
				type="file"
				accept="image/*"
				multiple
				onchange={handleImageSelect}
				class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
			/>
			<p class="mt-1 text-xs text-gray-500">You can select multiple images at once or add them one at a time.</p>
			
			{#if previewUrls.length > 0}
				<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{#each previewUrls as url, index (url)}
						<div class="group relative aspect-square">
							<img
								src={url}
								alt="Preview {index + 1}"
								class="h-full w-full rounded-md border border-gray-200 object-cover"
							/>
							<button
								type="button"
								onclick={() => removeImage(index)}
								class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
								title="Remove image"
							>
								✕
							</button>
							{#if index === 0}
								<span class="absolute bottom-1 left-1 rounded bg-brand-dark px-2 py-0.5 text-xs text-white">
									Primary
								</span>
							{/if}
						</div>
					{/each}
				</div>
				<p class="mt-2 text-xs text-gray-500">The first image will be the primary product image.</p>
			{/if}
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
