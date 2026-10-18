<script>
	/**
	 * @type {{
	 *   label: string;
	 *   active?: boolean;
	 *   removable?: boolean;
	 *   onRemove?: () => void;
	 *   onClick?: () => void;
	 *   href?: string;
	 *   accent?: boolean;
	 *   class?: string;
	 *   children?: import('svelte').Snippet;
	 * }}
	 */
	let {
		label,
		active = false,
		removable = false,
		onRemove = undefined,
		onClick = undefined,
		href = undefined,
		accent = false,
		class: className = '',
		children
	} = $props();

	let toneClasses = $derived(
		active
			? accent
				? 'border-brand-accent bg-brand-accent text-white'
				: 'border-brand-brown bg-brand-brown text-white'
			: 'border-brand-light bg-white text-brand-dark hover:border-brand-brown/60 hover:text-brand-brown'
	);
</script>

{#if href}
	<a
		{href}
		class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 {toneClasses} {className}"
	>
		{@render children?.()}
		<span>{label}</span>
	</a>
{:else if onClick}
	<button
		type="button"
		onclick={onClick}
		class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 {toneClasses} {className}"
	>
		{@render children?.()}
		<span>{label}</span>
	</button>
{:else}
	<span
		class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-brown/20 bg-brand-brown/10 px-3 py-1 text-xs font-medium text-brand-brown {className}"
	>
		{label}
		{#if removable}
			<button
				type="button"
				onclick={onRemove}
				class="ml-0.5 rounded-full p-0.5 hover:bg-brand-brown/20"
				aria-label="Remove {label} filter"
			>
				<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</span>
{/if}
