<script>
	/**
	 * @type {{
	 *   variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	 *   size?: 'sm' | 'md' | 'lg';
	 *   pill?: boolean;
	 *   href?: string;
	 *   type?: 'button' | 'submit' | 'reset';
	 *   disabled?: boolean;
	 *   class?: string;
	 *   onclick?: (event: MouseEvent) => void;
	 *   children?: import('svelte').Snippet;
	 *   [key: string]: any;
	 * }}
	 */
	let {
		variant = 'primary',
		size = 'md',
		pill = false,
		href = undefined,
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		...rest
	} = $props();

	const variants = {
		primary: 'bg-brand-brown text-white shadow-card hover:shadow-card-hover hover:bg-brand-dark',
		secondary: 'bg-brand-dark text-white shadow-card hover:shadow-card-hover hover:bg-brand-brown',
		outline:
			'border border-brand-light bg-transparent text-brand-dark hover:border-brand-brown hover:text-brand-brown',
		ghost: 'bg-transparent text-brand-dark hover:bg-brand-light/40'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};

	let classes = $derived(
		`inline-flex items-center justify-center gap-1.5 font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${pill ? 'rounded-full' : 'rounded-[var(--radius-md)]'} ${variants[variant]} ${sizes[size]} ${className}`
	);
</script>

{#if href && !disabled}
	<a {href} class={classes} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button {type} {disabled} class={classes} {...rest}>
		{@render children?.()}
	</button>
{/if}
