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

	$effect(() => {
		colors = anyData.product?.colors ?? [];
	});

	function addColor() {
		if (newColor && !colors.includes(newColor)) {
			colors = [...colors, newColor];
		}
	}

	function removeColor(/** @type {string} */ color) {
		colors = colors.filter((c) => c !== color);
	}
</script>

<div class="max-w-2xl">
	<div class="mb-6 flex items-center justify-between">
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
		<div class="grid grid-cols-2 gap-4">
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

		<!-- Row 5: Image -->
		<div>
			<label for="image" class="block text-sm font-medium text-gray-700">Current Image</label>
			<div class="mt-2 flex items-center gap-4">
				<img
					src={product.image_url?.[0] ?? ''}
					alt={product.name}
					class="h-20 w-20 rounded-md border border-gray-200 object-cover"
				/>
				<div class="flex-1">
					<label for="image-upload" class="mb-1 block text-xs text-gray-500"
						>Upload new image (optional)</label
					>
					<input
						id="image-upload"
						name="image"
						type="file"
						accept="image/*"
						class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
					/>
				</div>
			</div>
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
