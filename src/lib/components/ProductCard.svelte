<script>
	/**
	 * @type {{
	 *   name: string;
	 *   slug: string;
	 *   price: number;
	 *   image_url: string[];
	 *   category?: string;
	 * }}
	 */
	let { name, slug, price, image_url, category = '' } = $props();

	// Use the first image from the array, or empty string if no images
	let displayImage = $derived(image_url && image_url.length > 0 ? image_url[0] : '');
	let imageLoaded = $state(false);
</script>

<a
	href="/product/{slug}"
	class="group block overflow-hidden rounded-lg bg-brand-bg shadow-sm ring-1 ring-brand-light transition-all hover:shadow-lg hover:ring-brand-mid/30"
>
	<div class="relative aspect-square overflow-hidden bg-brand-bg">
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
				: 'opacity-0'}"
			loading="lazy"
			onload={() => (imageLoaded = true)}
		/>
		{#if category}
			<div
				class="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-brand-dark backdrop-blur-sm"
			>
				{category}
			</div>
		{/if}
	</div>
	<div class="p-4">
		<h3 class="text-sm font-bold text-brand-dark transition-colors group-hover:text-brand-brown">
			{name}
		</h3>
		<p class="mt-1 text-lg font-medium text-brand-brown">${price.toFixed(2)}</p>
	</div>
</a>
