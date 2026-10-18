<script>
	/**
	 * @type {{
	 *   tone?: 'sale' | 'sold' | 'low-stock' | 'new' | 'in-stock' | 'neutral' | 'admin-in-stock' | 'admin-sold';
	 *   size?: 'sm' | 'md';
	 *   pill?: boolean;
	 *   uppercase?: boolean;
	 *   class?: string;
	 *   children?: import('svelte').Snippet;
	 * }}
	 */
	let {
		tone = 'neutral',
		size = 'sm',
		pill = false,
		uppercase = true,
		class: className = '',
		children
	} = $props();

	const tones = {
		sale: 'bg-red-600 text-white',
		sold: 'bg-brand-dark text-white',
		'low-stock': 'bg-red-600 text-white',
		new: 'bg-brand-accent text-white',
		'in-stock': 'bg-green-100 text-green-800',
		neutral: 'bg-white/90 text-brand-dark backdrop-blur-sm',
		'admin-in-stock': 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
		'admin-sold': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
	};

	const sizes = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-2.5 py-1 text-sm'
	};

	let classes = $derived(
		`inline-flex items-center font-semibold tracking-wide ${uppercase ? 'uppercase' : ''} ${pill ? 'rounded-full' : 'rounded-[var(--radius-sm)]'} ${tones[tone]} ${sizes[size]} ${className}`
	);
</script>

<span class={classes}>
	{@render children?.()}
</span>
