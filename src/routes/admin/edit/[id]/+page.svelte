<script>
	import { enhance } from '$app/forms';
	import ImageManager from '$lib/components/admin/ImageManager.svelte';
	import ColorPicker from '$lib/components/admin/ColorPicker.svelte';
	import { formatBytes } from '$lib/utils/imageCompression.js';

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
	let clientError = $state('');

	/** @type {string[]} */
	let colors = $state([]);

	/** @type {any[]} */
	let imageItems = $state([]);

	$effect(() => {
		colors = anyData.product?.colors ?? [];
		imageItems = /** @type {string[]} */ (anyData.product?.image_url ?? []).map((url, index) => ({
			id: `existing:${url}:${index}`,
			kind: 'existing',
			url
		}));
	});

	// Safety margin under Vercel's default ~4.5MB serverless body limit. Only
	// newly-added photos count against it — existing ones travel as URL
	// strings in imageOrder, not re-uploaded bytes.
	const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

	function validateBeforeSubmit() {
		if (imageItems.length === 0) {
			clientError = 'Add at least one product photo.';
			return false;
		}
		if (imageItems.some((item) => item.compressing)) {
			clientError = 'Please wait for photo compression to finish.';
			return false;
		}
		const totalNewBytes = imageItems
			.filter((item) => item.kind === 'new')
			.reduce((sum, item) => sum + (item.file?.size ?? 0), 0);
		if (totalNewBytes > MAX_TOTAL_BYTES) {
			clientError = `Total new photo size (${formatBytes(totalNewBytes)}) is too large — remove a photo and try again.`;
			return false;
		}
		clientError = '';
		return true;
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Edit Product</h1>
		<a href="/admin" class="text-sm font-medium text-brand-mid hover:text-brand-dark">Cancel</a>
	</div>

	{#if anyForm?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{anyForm.error}
		</div>
	{/if}
	{#if clientError}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{clientError}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		class="space-y-6"
		use:enhance={({ formData, cancel }) => {
			if (!validateBeforeSubmit()) {
				cancel();
				return;
			}

			/** @type {string[]} */
			const imageOrder = [];
			for (const item of imageItems) {
				if (item.kind === 'existing') {
					imageOrder.push(item.url);
				} else {
					imageOrder.push(`new:${item.id}`);
					formData.append('newImages', item.file);
					formData.append('newImageIds', item.id);
				}
			}
			formData.set('imageOrder', JSON.stringify(imageOrder));

			submitting = true;
			return async ({ update }) => {
				submitting = false;
				update();
			};
		}}
	>
		<!-- Basic Info -->
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
			<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">Basic Info</h2>
			<div class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-brand-dark">Product Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						value={anyForm?.name ?? product.name}
						class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="price" class="block text-sm font-medium text-brand-dark">Price ($)</label>
						<input
							id="price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							required
							value={anyForm?.price ?? product.price}
							class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
						/>
					</div>
					<div>
						<label for="category" class="block text-sm font-medium text-brand-dark">Category</label>
						<select
							id="category"
							name="category"
							required
							class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
						>
							<option value="">Select Category</option>
							{#each categories as cat}
								<option
									value={cat.value}
									selected={(anyForm?.category ?? product.category) === cat.value}
									>{cat.label}</option
								>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-brand-dark"
						>Description</label
					>
					<textarea
						id="description"
						name="description"
						rows="3"
						class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
						>{anyForm?.description ?? product.description ?? ''}</textarea
					>
				</div>
			</div>
		</div>

		<!-- Dimensions + Colors -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
				<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">
					Dimensions <span class="font-normal text-brand-mid normal-case">(optional)</span>
				</h2>
				<div class="grid grid-cols-3 gap-2">
					<div>
						<label for="dim_width" class="block text-xs text-brand-mid">W</label>
						<input
							id="dim_width"
							name="dim_width"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.width ?? ''}
							class="mt-0.5 block w-full rounded-md border border-brand-light px-1.5 py-1 text-xs shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
					</div>
					<div>
						<label for="dim_height" class="block text-xs text-brand-mid">H</label>
						<input
							id="dim_height"
							name="dim_height"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.height ?? ''}
							class="mt-0.5 block w-full rounded-md border border-brand-light px-1.5 py-1 text-xs shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
					</div>
					<div>
						<label for="dim_depth" class="block text-xs text-brand-mid">D</label>
						<input
							id="dim_depth"
							name="dim_depth"
							type="number"
							step="0.1"
							min="0"
							value={product.dimensions?.depth ?? ''}
							class="mt-0.5 block w-full rounded-md border border-brand-light px-1.5 py-1 text-xs shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
						/>
					</div>
				</div>
				<div class="mt-2">
					<select
						id="dim_unit"
						name="dim_unit"
						class="block w-full rounded-md border border-brand-light px-1.5 py-1 text-xs shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none"
					>
						<option value="in" selected={(product.dimensions?.unit ?? 'in') === 'in'}>inches</option
						>
						<option value="cm" selected={product.dimensions?.unit === 'cm'}>cm</option>
						<option value="ft" selected={product.dimensions?.unit === 'ft'}>feet</option>
					</select>
				</div>
			</div>

			<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
				<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">
					Colors <span class="font-normal text-brand-mid normal-case">(optional)</span>
				</h2>
				<ColorPicker bind:colors />
			</div>
		</div>

		<!-- Images -->
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
			<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">Product Photos</h2>
			<ImageManager bind:items={imageItems} />
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-md bg-brand-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-50"
		>
			{submitting ? 'Saving Changes...' : 'Update Product'}
		</button>
	</form>
</div>
