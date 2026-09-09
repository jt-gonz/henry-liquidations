<script>
	import { addToCart } from '$lib/stores/cart.js';
	import { track } from '@vercel/analytics';

	/**
	 * @type {{
	 *   id: string;
	 *   name: string;
	 *   slug: string;
	 *   price: number;
	 *   image_url: string[];
	 *   category?: string;
	 *   in_stock?: boolean;
	 *   created_at?: string | null;
	 *   colors?: string[] | null;
	 * }}
	 */
	let {
		id,
		name,
		slug,
		price,
		image_url,
		category = '',
		in_stock = true,
		created_at = null,
		colors = null
	} = $props();

	// Use the first image from the array, or empty string if no images
	let displayImage = $derived(image_url && image_url.length > 0 ? image_url[0] : '');
	let imageLoaded = $state(false);
	let imageFailed = $state(false);
	let showPlaceholder = $derived(!displayImage || imageFailed);
	let added = $state(false);

	let isNew = $derived.by(() => {
		if (!created_at) return false;
		const ageDays = (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24);
		return ageDays <= 7;
	});

	/** @param {MouseEvent} event */
	function handleAddToCart(event) {
		event.preventDefault();
		event.stopPropagation();

		addToCart({
			id,
			name,
			price,
			image_url: displayImage,
			slug,
			color: colors?.[0] ?? undefined
		});

		track('add_to_cart', {
			product_id: id,
			product_name: name,
			product_price: price,
			category,
			color: colors?.[0] ?? 'none',
			source: 'quick_add'
		});

		added = true;
		setTimeout(() => {
			added = false;
		}, 2000);
	}
</script>

<div
	class="group relative overflow-hidden rounded-lg bg-brand-bg shadow-sm ring-1 ring-brand-light transition-all hover:shadow-lg hover:ring-brand-brown/30"
>
	<a href="/product/{slug}" class="block">
		<div class="relative aspect-square overflow-hidden bg-brand-bg">
			{#if showPlaceholder}
				<div
					class="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-light/20 text-brand-mid"
				>
					<svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M21 8.25V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
						/>
					</svg>
					<span class="text-xs font-medium">No Image</span>
				</div>
			{:else}
				<div
					class="absolute inset-0 animate-pulse bg-brand-light/30"
					class:hidden={imageLoaded}
					aria-hidden="true"
				></div>
				<img
					src={displayImage}
					alt={name}
					class="relative h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 {imageLoaded
						? 'opacity-100'
						: 'opacity-0'} {!in_stock ? 'grayscale' : ''}"
					loading="lazy"
					onload={() => (imageLoaded = true)}
					onerror={() => (imageFailed = true)}
				/>
			{/if}
			{#if category}
				<div
					class="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-brand-dark backdrop-blur-sm"
				>
					{category}
				</div>
			{/if}
			{#if !in_stock}
				<div
					class="absolute top-2 right-2 rounded-md bg-brand-dark px-2 py-1 text-xs font-bold tracking-wide text-white uppercase"
				>
					Sold
				</div>
			{:else if isNew}
				<div
					class="absolute top-2 right-2 rounded-md bg-brand-accent px-2 py-1 text-xs font-bold tracking-wide text-white uppercase"
				>
					New
				</div>
			{/if}
		</div>
		<div class="p-4 {in_stock ? 'pb-14' : ''}">
			<h3 class="text-sm font-bold text-brand-dark transition-colors group-hover:text-brand-brown">
				{name}
			</h3>
			<p class="mt-1 text-lg font-medium text-brand-brown">${price.toFixed(2)}</p>
		</div>
	</a>

	{#if in_stock}
		<button
			type="button"
			onclick={handleAddToCart}
			class="absolute right-3 bottom-3 left-3 rounded-md px-3 py-2 text-xs font-semibold text-white shadow transition-colors {added
				? 'bg-green-600'
				: 'bg-brand-brown hover:bg-brand-brown-dark'}"
		>
			{added ? 'Added ✓' : 'Add to Cart'}
		</button>
	{/if}
</div>
