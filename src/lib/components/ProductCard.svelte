<script>
	/**
	 * @type {{
	 *   name: string;
	 *   slug: string;
	 *   price: number;
	 *   image_url: string;
	 *   category?: string;
	 * }}
	 */
	let { name, slug, price, image_url, category = '' } = $props();
	let imageLoaded = $state(false);
</script>

<a
	href="/product/{slug}"
	class="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg hover:ring-red-600/20"
>
	<div class="relative aspect-square overflow-hidden bg-gray-100">
		<div class="absolute inset-0 bg-gray-200 animate-pulse" class:hidden={imageLoaded} aria-hidden="true"></div>
		<img
			src={image_url}
			alt={name}
			class="relative h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 {imageLoaded ? 'opacity-100' : 'opacity-0'}"
			loading="lazy"
			onload={() => (imageLoaded = true)}
		/>
		{#if category}
			<div class="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-900 backdrop-blur-sm">
				{category}
			</div>
		{/if}
	</div>
	<div class="p-4">
		<h3 class="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">{name}</h3>
		<p class="mt-1 text-lg font-bold text-gray-900">${price.toFixed(2)}</p>
	</div>
</a>
