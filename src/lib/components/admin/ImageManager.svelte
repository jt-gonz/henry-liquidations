<script>
	import { compressImage, formatBytes } from '$lib/utils/imageCompression.js';

	/**
	 * @typedef {{
	 *   id: string,
	 *   kind: 'existing' | 'new',
	 *   url: string,
	 *   file?: File,
	 *   originalSize?: number,
	 *   compressedSize?: number,
	 *   compressing?: boolean
	 * }} ImageItem
	 */

	/** @type {{ items: ImageItem[], maxImages?: number }} */
	let { items = $bindable([]), maxImages = 12 } = $props();

	let isDragging = $state(false);
	let capMessage = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let capMessageTimeout;

	/** @type {HTMLInputElement | undefined} */
	let fileInput = $state();

	let atCapacity = $derived(items.length >= maxImages);

	/** @param {FileList | File[] | null} fileList */
	function addFiles(fileList) {
		if (!fileList) return;
		const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
		if (files.length === 0) return;

		const availableSlots = maxImages - items.length;
		const filesToAdd = files.slice(0, Math.max(0, availableSlots));

		if (filesToAdd.length < files.length) {
			clearTimeout(capMessageTimeout);
			capMessage = `Only added ${filesToAdd.length} of ${files.length} — max ${maxImages} images per product.`;
			capMessageTimeout = setTimeout(() => (capMessage = ''), 4000);
		}

		for (const file of filesToAdd) {
			const id = crypto.randomUUID();
			const previewUrl = URL.createObjectURL(file);

			items = [
				...items,
				{ id, kind: 'new', url: previewUrl, file, originalSize: file.size, compressing: true }
			];

			compressImage(file).then((result) => {
				items = items.map((item) =>
					item.id === id
						? {
								...item,
								file: result.file,
								originalSize: result.originalSize,
								compressedSize: result.compressedSize,
								compressing: false
							}
						: item
				);
			});
		}
	}

	/** @param {Event} e */
	function handleFileInputChange(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		addFiles(input.files);
		input.value = '';
	}

	/** @param {DragEvent} e */
	function handleDrop(e) {
		e.preventDefault();
		isDragging = false;
		addFiles(e.dataTransfer?.files ?? null);
	}

	/** @param {string} id */
	function removeItem(id) {
		const item = items.find((i) => i.id === id);
		if (item?.kind === 'new') {
			URL.revokeObjectURL(item.url);
		}
		items = items.filter((i) => i.id !== id);
	}

	/**
	 * @param {string} id
	 * @param {-1 | 1} direction
	 */
	function moveItem(id, direction) {
		const index = items.findIndex((i) => i.id === id);
		const target = index + direction;
		if (index === -1 || target < 0 || target >= items.length) return;

		const next = [...items];
		[next[index], next[target]] = [next[target], next[index]];
		items = next;
	}
</script>

<div>
	{#if !atCapacity}
		<button
			type="button"
			onclick={() => fileInput?.click()}
			ondragover={(e) => {
				e.preventDefault();
				isDragging = true;
			}}
			ondragleave={() => (isDragging = false)}
			ondrop={handleDrop}
			class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors {isDragging
				? 'border-brand-dark bg-brand-bg'
				: 'border-brand-light bg-brand-bg/50 hover:border-brand-mid'}"
		>
			<svg class="h-8 w-8 text-brand-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
				/>
			</svg>
			<p class="text-sm font-medium text-brand-dark">
				<span class="text-brand-brown">Drag photos here</span> or click to browse
			</p>
			<p class="text-xs text-brand-mid">Images are compressed automatically before upload.</p>
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			onchange={handleFileInputChange}
			class="hidden"
		/>
	{:else}
		<p class="rounded-lg border border-brand-light bg-brand-bg/50 px-4 py-3 text-center text-sm text-brand-mid">
			Maximum {maxImages} images reached. Remove one to add another.
		</p>
	{/if}

	{#if capMessage}
		<p class="mt-2 text-xs text-amber-700">{capMessage}</p>
	{/if}

	{#if items.length > 0}
		<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
			{#each items as item, index (item.id)}
				<div class="group relative aspect-square">
					<img
						src={item.url}
						alt="Product photo {index + 1}"
						class="h-full w-full rounded-lg border border-brand-light object-cover {item.compressing
							? 'opacity-60'
							: ''}"
					/>

					{#if item.compressing}
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="h-6 w-6 animate-spin text-brand-dark" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
							</svg>
						</div>
					{/if}

					{#if index === 0}
						<span class="absolute top-1.5 left-1.5 rounded bg-brand-dark px-2 py-0.5 text-xs font-medium text-white">
							Primary
						</span>
					{/if}

					{#if item.kind === 'new' && !item.compressing && item.compressedSize != null}
						<span
							class="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white"
						>
							{formatBytes(item.compressedSize)}
						</span>
					{/if}

					<!-- Controls: always visible (not hover-only) for touch devices -->
					<div class="absolute top-1.5 right-1.5 flex gap-1">
						<button
							type="button"
							onclick={() => removeItem(item.id)}
							title="Remove"
							class="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow hover:bg-white"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M5.28 4.22a.75.75 0 00-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 101.06 1.06L10 11.06l4.72 4.72a.75.75 0 101.06-1.06L11.06 10l4.72-4.72a.75.75 0 00-1.06-1.06L10 8.94 5.28 4.22z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
					<div class="absolute right-1.5 bottom-1.5 flex gap-1">
						<button
							type="button"
							onclick={() => moveItem(item.id, -1)}
							disabled={index === 0}
							title="Move earlier"
							class="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-brand-dark shadow hover:bg-white disabled:pointer-events-none disabled:opacity-30"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
						<button
							type="button"
							onclick={() => moveItem(item.id, 1)}
							disabled={index === items.length - 1}
							title="Move later"
							class="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-brand-dark shadow hover:bg-white disabled:pointer-events-none disabled:opacity-30"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
		<p class="mt-2 text-xs text-brand-mid">
			The first photo is the primary image. Use the arrows to reorder.
		</p>
	{/if}
</div>
