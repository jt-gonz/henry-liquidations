<script>
	/** @typedef {{ id: string, name: string, slug: string, description: string, price: number, category: string, image_url: string[], in_stock: boolean, dimensions: { width?: number, height?: number, depth?: number, unit?: string } | null, colors: string[] | null, created_at: string }} Product */
	/** @typedef {{ id: string, value: string, label: string, sort_order: number, is_active: boolean }} Category */

	let { data, form } = $props();

	/** @type {any} */
	let anyData = $derived(data);
	/** @type {any} */
	let anyForm = $derived(form);

	/** @type {Product} */
	let product = $derived(anyData.product);

	/** @type {Category[]} */
	let categories = $derived(anyData.categories ?? []);
	let submitting = $state(false);

	/** @type {string[]} */
	let colors = $state([]);
	let newColor = $state('#000000');

	/** @type {string[]} */
	let currentImages = $state([]);
	/** @type {string[]} */
	let imagesToRemove = $state([]);
	
	/** @type {File[]} */
	let newImages = $state([]);
	/** @type {string[]} */
	let newImagePreviews = $state([]);

	$effect(() => {
		colors = anyData.product?.colors ?? [];
		currentImages = anyData.product?.image_url ?? [];
	});

	function addColor() {
		if (newColor && !colors.includes(newColor)) {
			colors = [...colors, newColor];
		}
	}

	function removeColor(/** @type {string} */ color) {
		colors = colors.filter((c) => c !== color);
	}

	/**
	 * @param {string} imageUrl
	 */
	function markForRemoval(imageUrl) {
		imagesToRemove = [...imagesToRemove, imageUrl];
		currentImages = currentImages.filter((url) => url !== imageUrl);
	}

	/**
	 * @param {Event} e
	 */
	function handleNewImageSelect(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		if (input.files && input.files.length > 0) {
			const files = Array.from(input.files);
			newImages = [...newImages, ...files];
			
			// Generate preview URLs (client-side only)
			if (typeof window !== 'undefined') {
				files.forEach((file) => {
					const url = URL.createObjectURL(file);
					newImagePreviews = [...newImagePreviews, url];
				});
			}
		}
	}

	/**
	 * @param {number} index
	 */
	function removeNewImage(index) {
		if (typeof window !== 'undefined') {
			URL.revokeObjectURL(newImagePreviews[index]);
		}
		newImages = newImages.filter((_, i) => i !== index);
		newImagePreviews = newImagePreviews.filter((_, i) => i !== index);
	}
</script>

<div class="max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Edit Product</h1>
		<a href="/admin" class="text-sm font-medium text-gray-500 hover:text-gray-900">Cancel</a>
	</div>

	{#if anyForm?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{anyForm.error}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		class="space-y-4"
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
				value={anyForm?.name ?? product.name}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none sm:text-sm"
			/>
		</div>

		<!-- Row 2: Price + Category -->
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
					value={anyForm?.price ?? product.price}
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
						<option
							value={cat.value}
							selected={(anyForm?.category ?? product.category) === cat.value}>{cat.label}</option
						>
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
				>{anyForm?.description ?? product.description ?? ''}</textarea
			>
		</div>

		<!-- Row 4: Dimensions + Colors -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<fieldset class="rounded-md border border-gray-200 p-3">
				<legend class="px-1 text-xs font-medium text-gray-700">Dimensions (optional)</legend>
				<div class="mt-1 grid grid-cols-3 gap-2">
					<div>
						<label for="dim_width" class="block text-xs text-gray-500">W</label>
						<input
							id="dim_width"
							name="dim_width"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.width ?? ''}
							class="mt-0.5 block w-full rounded-md border border-gray-300 px-1.5 py-1 text-xs shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="dim_height" class="block text-xs text-gray-500">H</label>
						<input
							id="dim_height"
							name="dim_height"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.height ?? ''}
							class="mt-0.5 block w-full rounded-md border border-gray-300 px-1.5 py-1 text-xs shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="dim_depth" class="block text-xs text-gray-500">D</label>
						<input
							id="dim_depth"
							name="dim_depth"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.depth ?? ''}
							class="mt-0.5 block w-full rounded-md border border-gray-300 px-1.5 py-1 text-xs shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none"
						/>
					</div>
				</div>
				<div class="mt-2">
					<select
						id="dim_unit"
						name="dim_unit"
						class="block w-full rounded-md border border-gray-300 px-1.5 py-1 text-xs shadow-sm focus:border-gray-500 focus:ring-gray-500 focus:outline-none"
					>
						<option value="in" selected={(product.dimensions?.unit ?? 'in') === 'in'}>inches</option
						>
						<option value="cm" selected={product.dimensions?.unit === 'cm'}>cm</option>
						<option value="ft" selected={product.dimensions?.unit === 'ft'}>feet</option>
					</select>
				</div>
			</fieldset>

			<fieldset class="rounded-md border border-gray-200 p-3">
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
				<input type="hidden" name="colors" value={JSON.stringify(colors)} />
			</fieldset>
		</div>

		<!-- Row 5: Image Gallery Management -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">Product Images</label>
			
			<!-- Current Images -->
			{#if currentImages.length > 0}
				<div class="mb-4">
					<p class="mb-2 text-xs font-medium text-gray-600">Current Images:</p>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{#each currentImages as imageUrl, index (imageUrl)}
							<div class="group relative aspect-square">
								<img
									src={imageUrl}
									alt={`${product.name} - Image ${index + 1}`}
									class="h-full w-full rounded-md border border-gray-200 object-cover"
								/>
								<button
									type="button"
									onclick={() => markForRemoval(imageUrl)}
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
				</div>
			{/if}

			<!-- New Images Preview -->
			{#if newImagePreviews.length > 0}
				<div class="mb-4">
					<p class="mb-2 text-xs font-medium text-gray-600">New Images to Add:</p>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{#each newImagePreviews as previewUrl, index (previewUrl)}
							<div class="group relative aspect-square">
								<img
									src={previewUrl}
									alt={`New Image ${index + 1}`}
									class="h-full w-full rounded-md border border-gray-200 object-cover"
								/>
								<button
									type="button"
									onclick={() => removeNewImage(index)}
									class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
									title="Remove image"
								>
									✕
								</button>
								<span class="absolute bottom-1 left-1 rounded bg-green-600 px-2 py-0.5 text-xs text-white">
									New
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Add New Images -->
			<div>
				<label for="newImages" class="mb-1 block text-xs text-gray-500">Add More Images:</label>
				<input
					id="newImages"
					name="newImages"
					type="file"
					accept="image/*"
					multiple
					onchange={handleNewImageSelect}
					class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
				/>
			</div>

			<!-- Hidden inputs for data submission -->
			<input type="hidden" name="currentImages" value={JSON.stringify(currentImages)} />
			<input type="hidden" name="imagesToRemove" value={imagesToRemove.join(',') } />
			
			<p class="mt-2 text-xs text-gray-500">
				The first image in the gallery will be the primary product image. You must have at least one image.
			</p>
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{submitting ? 'Saving Changes...' : 'Update Product'}
		</button>
	</form>
</div>
