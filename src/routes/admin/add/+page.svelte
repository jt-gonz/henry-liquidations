<!-- Add Product Page -->
<script>
	import { enhance } from '$app/forms';
	import ImageManager from '$lib/components/admin/ImageManager.svelte';
	import ColorPicker from '$lib/components/admin/ColorPicker.svelte';
	import { formatBytes } from '$lib/utils/imageCompression.js';

	let { data, form } = $props();
	/** @type {{ id: string, value: string, label: string, sort_order: number, is_active: boolean }[]} */
	let categories = $derived(/** @type {any} */ (data).categories ?? []);
	let submitting = $state(false);
	let clientError = $state('');

	/** @type {string[]} */
	let colors = $state([]);

	/** @type {any[]} */
	let imageItems = $state([]);

	// Safety margin under Vercel's default ~4.5MB serverless body limit.
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
		const totalBytes = imageItems.reduce((sum, item) => sum + (item.file?.size ?? 0), 0);
		if (totalBytes > MAX_TOTAL_BYTES) {
			clientError = `Total photo size (${formatBytes(totalBytes)}) is too large — remove a photo and try again.`;
			return false;
		}
		clientError = '';
		return true;
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-brand-dark">Add New Product</h1>
		<a href="/admin" class="text-sm font-medium text-brand-mid hover:text-brand-dark">Cancel</a>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
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

			for (const item of imageItems) {
				if (item.file) formData.append('images', item.file);
			}

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
						value={form?.name ?? ''}
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
							value={form?.price ?? ''}
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
								<option value={cat.value} selected={form?.category === cat.value}
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
						>{form?.description ?? ''}</textarea
					>
				</div>
			</div>
		</div>

		<!-- Dimensions -->
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
			<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">
				Dimensions <span class="font-normal text-brand-mid normal-case">(optional)</span>
			</h2>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<label for="dim_width" class="mb-1 block text-xs text-brand-mid">Width</label>
					<input
						id="dim_width"
						name="dim_width"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-brand-light px-2 py-1.5 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_height" class="mb-1 block text-xs text-brand-mid">Height</label>
					<input
						id="dim_height"
						name="dim_height"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-brand-light px-2 py-1.5 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_depth" class="mb-1 block text-xs text-brand-mid">Depth</label>
					<input
						id="dim_depth"
						name="dim_depth"
						type="number"
						step="0.1"
						min="0"
						class="block w-full rounded-md border border-brand-light px-2 py-1.5 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="dim_unit" class="mb-1 block text-xs text-brand-mid">Unit</label>
					<select
						id="dim_unit"
						name="dim_unit"
						class="block w-full rounded-md border border-brand-light px-2 py-1.5 shadow-sm focus:border-brand-mid focus:ring-brand-mid focus:outline-none sm:text-sm"
					>
						<option value="in">inches</option>
						<option value="cm">cm</option>
						<option value="ft">feet</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Colors -->
		<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-light/50">
			<h2 class="mb-4 text-sm font-bold tracking-wide text-brand-dark uppercase">
				Colors <span class="font-normal text-brand-mid normal-case">(optional)</span>
			</h2>
			<ColorPicker bind:colors />
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
			{submitting ? 'Saving...' : 'Save Product'}
		</button>
	</form>
</div>
