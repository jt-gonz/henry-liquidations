<script>
	/**
	 * @type {{
	 *   page: number;
	 *   totalPages: number;
	 *   makeHref: (page: number) => string;
	 *   class?: string;
	 * }}
	 */
	let { page, totalPages, makeHref, class: className = '' } = $props();

	/** Windowed page numbers: first, last, current +/-1, with ellipsis gaps. */
	let pageNumbers = $derived.by(() => {
		const pages = new Set([1, totalPages, page, page - 1, page + 1]);
		return [...pages]
			.filter((p) => p >= 1 && p <= totalPages)
			.sort((a, b) => a - b);
	});

	const linkBase =
		'inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm font-medium transition-colors';
</script>

{#if totalPages > 1}
	<nav class="flex items-center justify-center gap-1 {className}" aria-label="Pagination">
		<a
			href={makeHref(Math.max(1, page - 1))}
			class="{linkBase} {page <= 1
				? 'pointer-events-none text-brand-mid/40'
				: 'text-brand-dark hover:bg-brand-light/50'}"
			aria-disabled={page <= 1}
		>
			Prev
		</a>

		{#each pageNumbers as p, i}
			{#if i > 0 && p - pageNumbers[i - 1] > 1}
				<span class="px-1 text-brand-mid">…</span>
			{/if}
			<a
				href={makeHref(p)}
				class="{linkBase} {p === page
					? 'bg-brand-brown text-white'
					: 'text-brand-dark hover:bg-brand-light/50'}"
				aria-current={p === page ? 'page' : undefined}
			>
				{p}
			</a>
		{/each}

		<a
			href={makeHref(Math.min(totalPages, page + 1))}
			class="{linkBase} {page >= totalPages
				? 'pointer-events-none text-brand-mid/40'
				: 'text-brand-dark hover:bg-brand-light/50'}"
			aria-disabled={page >= totalPages}
		>
			Next
		</a>
	</nav>
{/if}
