<!-- Product Detail Page -->
<script>
	import { addToCart } from '$lib/stores/cart.js';
	import { fade, scale } from 'svelte/transition';
	import { getColorName } from '$lib/constants/colors.js';

	/** @type {{ data: { product: any } }} */
	let { data } = $props();
	let product = $derived(data.product);
	let added = $state(false);

	// Image gallery state
	let images = $derived(product.image_url || []);
	let currentImageIndex = $state(0);
	let currentImage = $derived(images[currentImageIndex] || '');

	// Colors - initialize as null, then set in effect
	let selectedColor = $state(/** @type {string | null} */ (null));

	// Update selectedColor when product changes
	$effect(() => {
		selectedColor = product.colors?.[0] ?? null;
	});

	// Lightbox
	let showLightbox = $state(false);

	function openLightbox() {
		showLightbox = true;
	}

	function closeLightbox() {
		showLightbox = false;
	}

	function nextImage() {
		if (images.length > 1) {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}
	}

	function prevImage() {
		if (images.length > 1) {
			currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
		}
	}

	/**
	 * @param {number} index
	 */
	function selectImage(index) {
		currentImageIndex = index;
	}

	function handleAddToCart() {
		addToCart({
			id: product.id,
			name: product.name,
			price: Number(product.price),
			image_url: currentImage,
			slug: product.slug,
			color: selectedColor ?? undefined
		});
		added = true;
		setTimeout(() => {
			added = false;
		}, 2000);
	}

	/** @type {Record<string, string>} */
	const unitLabels = { in: '"', cm: ' cm', ft: ' ft' };

	/**
	 * Format description by inserting newlines before "-" characters
	 * @param {string} desc
	 */
	function formatDescription(desc) {
		if (!desc) return '';
		// Insert newline before "-" at the start of lines or after other content
		// But preserve the HTML tags that might already be there
		return desc.replace(/([^\n])\s*-\s/g, '$1\n- ');
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<nav aria-label="Breadcrumb" class="mb-8">
		<ol role="list" class="flex items-center space-x-2">
			<li>
				<a href="/shop" class="text-sm font-medium text-brand-mid hover:text-brand-dark">Shop</a>
			</li>
			<li>
				<svg
					class="h-5 w-5 flex-shrink-0 text-brand-light"
					fill="currentColor"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
				</svg>
			</li>
			<li>
				<span class="text-sm font-medium text-brand-dark" aria-current="page">{product.name}</span>
			</li>
		</ol>
	</nav>

	<div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
		<!-- Product Image Gallery -->
		<div class="flex flex-col gap-4">
			<!-- Main Image -->
			<div
				class="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-brand-light bg-brand-bg object-cover sm:rounded-3xl"
				onclick={openLightbox}
				onkeydown={(e) => e.key === 'Enter' && openLightbox()}
				role="button"
				tabindex="0"
				aria-label="View full size image"
			>
				{#if images.length > 0}
					<img
						src={currentImage}
						alt={product.name}
						class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
						loading="lazy"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-brand-mid">
						No image available
					</div>
				{/if}

				<!-- Navigation arrows (only show if multiple images) -->
				{#if images.length > 1}
					<button
						type="button"
						class="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-dark opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
						onclick={(e) => {
							e.stopPropagation();
							prevImage();
						}}
						aria-label="Previous image"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5L8.25 12l7.5-7.5"
							/>
						</svg>
					</button>
					<button
						type="button"
						class="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-dark opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
						onclick={(e) => {
							e.stopPropagation();
							nextImage();
						}}
						aria-label="Next image"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
						</svg>
					</button>
				{/if}

				<div
					class="absolute right-4 bottom-4 rounded-full bg-white/90 p-2 text-brand-dark opacity-70 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
						/>
					</svg>
				</div>
			</div>

			<!-- Thumbnail Gallery -->
			{#if images.length > 1}
				<div class="flex gap-2 overflow-x-auto pb-2">
					{#each images as img, index (img)}
						<button
							type="button"
							class="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all {index ===
							currentImageIndex
								? 'border-brand-dark ring-2 ring-brand-dark ring-offset-2'
								: 'border-brand-light hover:border-brand-mid'}"
							onclick={() => selectImage(index)}
							aria-label="View image {index + 1} of {images.length}"
							aria-current={index === currentImageIndex ? 'true' : 'false'}
						>
							<img
								src={img}
								alt="{product.name} - view {index + 1}"
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Product Info -->
		<div class="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
			<!-- Title etc. existing code -->
			<h1 class="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">{product.name}</h1>

			<div class="mt-3 flex items-end gap-4">
				<p class="text-3xl font-medium tracking-tight text-brand-brown">
					${Number(product.price).toFixed(2)}
				</p>
				<div>
					{#if product.in_stock}
						<span
							class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
						>
							<span class="mr-1.5 h-2 w-2 rounded-full bg-green-600"></span>
							In Stock
						</span>
					{:else}
						<span
							class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
						>
							Sold
						</span>
					{/if}
				</div>
			</div>

			<!-- Description with formatted newlines -->
			<div class="mt-6 space-y-4 text-base text-gray-600">
				{#if product.description}
					<div class="leading-relaxed whitespace-pre-line">
						{@html formatDescription(product.description)}
					</div>
				{:else}
					<p>No description available.</p>
				{/if}
			</div>

			<!-- Category Tag (below description) -->
			{#if product.category}
				<div class="mt-4">
					<span
						class="inline-flex items-center rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold tracking-wide text-brand-dark uppercase"
					>
						{product.category}
					</span>
				</div>
			{/if}

			<!-- Dimensions -->
			{#if product.dimensions}
				<div class="mt-6 border-t border-brand-light pt-4">
					<h3 class="text-sm font-bold text-brand-dark">Dimensions</h3>
					<ul class="mt-2 space-y-1 text-sm text-gray-600">
						{#if product.dimensions.width}
							<li>Width: {product.dimensions.width}{unitLabels[product.dimensions.unit] ?? '"'}</li>
						{/if}
						{#if product.dimensions.height}
							<li>
								Height: {product.dimensions.height}{unitLabels[product.dimensions.unit] ?? '"'}
							</li>
						{/if}
						{#if product.dimensions.depth}
							<li>Depth: {product.dimensions.depth}{unitLabels[product.dimensions.unit] ?? '"'}</li>
						{/if}
					</ul>
				</div>
			{/if}

			<!-- Color Selection -->
			{#if product.colors && product.colors.length > 0}
				<div class="mt-6">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-bold text-brand-dark">Color</h3>
						{#if selectedColor}
							<span class="text-sm text-brand-mid">{getColorName(selectedColor)}</span>
						{/if}
					</div>
					<div class="mt-2 flex items-center space-x-3">
						{#each product.colors as color (color)}
							<button
								class="relative flex cursor-pointer items-center justify-center rounded-full p-0.5 ring-gray-400 focus:outline-none {selectedColor ===
								color
									? 'ring-2 ring-offset-1'
									: ''}"
								aria-label="Select color {getColorName(color)}"
								style="--tw-ring-color: {color === '#ffffff' ? '#e5e7eb' : color}"
								onclick={() => (selectedColor = color)}
							>
								<span
									aria-hidden="true"
									class="border-opacity-10 h-8 w-8 rounded-full border border-black"
									style="background-color: {color}"
								></span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Add to Cart -->
			<div class="mt-8 flex">
				{#if product.in_stock}
					<div class="flex flex-1 flex-col sm:flex-row sm:items-center sm:gap-6">
						<button
							onclick={handleAddToCart}
							class="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-brand-dark px-8 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-brand-mid focus:ring-2 focus:ring-brand-mid focus:ring-offset-2 focus:ring-offset-brand-bg focus:outline-none sm:w-full {added
								? 'bg-green-600 hover:bg-green-700'
								: ''}"
						>
							{#if added}
								<span class="flex items-center gap-2">
									<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
									Added to Cart
								</span>
							{:else}
								Add to Cart
							{/if}
						</button>
					</div>
				{:else}
					<button
						disabled
						class="flex w-full cursor-not-allowed items-center justify-center rounded-md border border-transparent bg-brand-bg px-8 py-3 text-base font-medium text-gray-400"
					>
						Sold Out
					</button>
				{/if}
			</div>

			<section aria-labelledby="details-heading" class="mt-12 border-t border-brand-light pt-10">
				<h2 id="details-heading" class="text-sm font-bold text-brand-dark">Additional Details</h2>
				<div class="mt-4 space-y-6">
					<p class="text-sm text-gray-600">
						This item is part of our liquidation inventory. All sales are final. Verified by our
						quality assurance team.
					</p>
				</div>
			</section>
		</div>
	</div>
</div>

{#if showLightbox}
	<div
		class="relative z-50 transition-opacity"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div class="fixed inset-0 bg-black/90 transition-opacity"></div>

		<div class="fixed inset-0 z-10 overflow-y-auto">
			<div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
				<!-- Modal panel -->
				<div
					class="relative transform overflow-hidden rounded-lg bg-transparent text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl"
					transition:scale={{ duration: 300, start: 0.95 }}
					onclick={closeLightbox}
					onkeydown={(e) => e.key === 'Enter' && closeLightbox()}
					role="button"
					tabindex="0"
				>
					<button
						type="button"
						class="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none"
						onclick={(e) => {
							e.stopPropagation();
							closeLightbox();
						}}
					>
						<span class="sr-only">Close</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-6 w-6"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<!-- Lightbox Navigation -->
					{#if images.length > 1}
						<button
							type="button"
							class="absolute top-1/2 left-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
							onclick={(e) => {
								e.stopPropagation();
								prevImage();
							}}
							aria-label="Previous image"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="h-6 w-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15.75 19.5L8.25 12l7.5-7.5"
								/>
							</svg>
						</button>
						<button
							type="button"
							class="absolute top-1/2 right-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
							onclick={(e) => {
								e.stopPropagation();
								nextImage();
							}}
							aria-label="Next image"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="h-6 w-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M8.25 4.5l7.5 7.5-7.5 7.5"
								/>
							</svg>
						</button>

						<!-- Image counter -->
						<div
							class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white"
						>
							{currentImageIndex + 1} / {images.length}
						</div>
					{/if}

					<img
						src={currentImage}
						alt={product.name}
						class="mx-auto max-h-[90vh] w-auto rounded-md object-contain"
						onclick={(e) => e.stopPropagation()}
						onkeydown={() => {}}
						role="presentation"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
