<script>
	import { goto } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce.js';

	/**
	 * @type {{
	 *   value?: string;
	 *   placeholder?: string;
	 *   autofocus?: boolean;
	 *   id?: string;
	 *   onClose?: () => void;
	 * }}
	 */
	let {
		value = $bindable(''),
		placeholder = 'Search furniture, appliances…',
		autofocus = false,
		id = 'global-search',
		onClose = undefined
	} = $props();

	/** @type {{ id: string, name: string, slug: string, price: number, image_url?: string[] }[]} */
	let results = $state([]);
	let status = $state(/** @type {'idle' | 'loading' | 'empty' | 'results'} */ ('idle'));
	let open = $state(false);
	let activeIndex = $state(-1);
	/** @type {HTMLInputElement | undefined} */
	let inputEl = $state();
	/** @type {HTMLDivElement | undefined} */
	let rootEl = $state();

	const runSearch = debounce(async (/** @type {string} */ query) => {
		if (!query.trim()) {
			results = [];
			status = 'idle';
			return;
		}

		status = 'loading';
		try {
			const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
			const json = await res.json();
			results = json.products ?? [];
			status = results.length > 0 ? 'results' : 'empty';
		} catch (e) {
			console.error('Search suggestion fetch failed:', e);
			results = [];
			status = 'empty';
		}
	}, 250);

	function handleInput() {
		activeIndex = -1;
		open = true;
		runSearch(value);
	}

	function seeAllHref() {
		return `/shop?search=${encodeURIComponent(value.trim())}`;
	}

	function goToActiveOrAll() {
		if (activeIndex >= 0 && results[activeIndex]) {
			goto(`/product/${results[activeIndex].slug}`);
		} else if (value.trim()) {
			goto(seeAllHref());
		} else {
			return;
		}
		close();
	}

	function close() {
		open = false;
		activeIndex = -1;
		onClose?.();
	}

	/** @param {KeyboardEvent} e */
	function handleKeydown(e) {
		if (e.key === 'Escape') {
			close();
			inputEl?.blur();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (results.length > 0) activeIndex = Math.min(activeIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (results.length > 0) activeIndex = Math.max(activeIndex - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			goToActiveOrAll();
		}
	}

	$effect(() => {
		if (autofocus) inputEl?.focus();
	});
</script>

<div class="relative w-full" bind:this={rootEl}>
	<div class="relative">
		<svg
			class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-mid"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
				clip-rule="evenodd"
			/>
		</svg>
		<input
			{id}
			bind:this={inputEl}
			type="text"
			{placeholder}
			bind:value
			oninput={handleInput}
			onfocus={() => (open = true)}
			onkeydown={handleKeydown}
			autocomplete="off"
			class="block w-full rounded-[var(--radius-md)] border border-brand-light bg-white py-2.5 pr-3 pl-9 text-sm text-brand-dark placeholder-brand-mid/60 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
		/>
	</div>

	{#if open && value.trim()}
		<!-- Backdrop closes the dropdown on outside click -->
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label="Close search suggestions"
			onclick={close}
		></button>
		<div
			class="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-[var(--radius-xl)] border border-brand-light bg-white py-2 shadow-popover"
		>
			{#if status === 'loading'}
				<p class="px-4 py-3 text-sm text-brand-mid">Searching…</p>
			{:else if status === 'empty'}
				<p class="px-4 py-3 text-sm text-brand-mid">No matches for "{value}"</p>
			{:else if status === 'results'}
				{#each results as result, i (result.id)}
					<a
						href="/product/{result.slug}"
						onclick={close}
						class="flex items-center gap-3 px-4 py-2 text-sm transition-colors {activeIndex === i
							? 'bg-brand-bg'
							: 'hover:bg-brand-bg'}"
					>
						<span
							class="h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-brand-light/30"
						>
							{#if result.image_url?.[0]}
								<img
									src={result.image_url[0]}
									alt=""
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							{/if}
						</span>
						<span class="min-w-0 flex-1 truncate font-medium text-brand-dark">{result.name}</span>
						<span class="shrink-0 font-medium text-brand-brown"
							>${Number(result.price).toFixed(2)}</span
						>
					</a>
				{/each}
			{/if}

			{#if value.trim()}
				<a
					href={seeAllHref()}
					onclick={close}
					class="mt-1 block border-t border-brand-light px-4 py-2.5 text-sm font-semibold text-brand-brown hover:text-brand-dark"
				>
					See all results for "{value}"
				</a>
			{/if}
		</div>
	{/if}
</div>
