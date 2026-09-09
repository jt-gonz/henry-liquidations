<script>
	import { getColorName } from '$lib/constants/colors.js';

	/** @type {{ colors: string[], name?: string }} */
	let { colors = $bindable([]), name = 'colors' } = $props();

	// A curated set of common furniture/appliance colors for one-click adding.
	const PRESETS = [
		'#000000',
		'#FFFFFF',
		'#808080',
		'#C0C0C0',
		'#F5F5DC',
		'#D2B48C',
		'#8B4513',
		'#D2691E',
		'#000080',
		'#006400',
		'#800000',
		'#FF0000'
	];

	let customColor = $state('#000000');

	/** @param {string} hex */
	function normalize(hex) {
		return hex.toUpperCase();
	}

	/** @param {string} hex */
	function isSelected(hex) {
		return colors.some((c) => normalize(c) === normalize(hex));
	}

	/** @param {string} hex */
	function addColor(hex) {
		if (!isSelected(hex)) {
			colors = [...colors, hex];
		}
	}

	/** @param {string} hex */
	function removeColor(hex) {
		colors = colors.filter((c) => c !== hex);
	}

	/** Whether a hex color is light enough to need a dark checkmark instead of white. @param {string} hex */
	function isLight(hex) {
		const c = hex.replace('#', '');
		const r = parseInt(c.substring(0, 2), 16);
		const g = parseInt(c.substring(2, 4), 16);
		const b = parseInt(c.substring(4, 6), 16);
		return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
	}
</script>

<div>
	<p class="mb-1.5 text-xs font-semibold tracking-wide text-brand-dark uppercase">Common Colors</p>
	<div class="flex flex-wrap gap-2">
		{#each PRESETS as hex (hex)}
			<button
				type="button"
				onclick={() => (isSelected(hex) ? removeColor(hex) : addColor(hex))}
				title={getColorName(hex)}
				class="relative h-8 w-8 rounded-full ring-2 transition-all {isSelected(hex)
					? 'ring-brand-dark'
					: 'ring-brand-light hover:ring-brand-mid'}"
				style="background-color: {hex}"
			>
				{#if isSelected(hex)}
					<span
						class="absolute inset-0 flex items-center justify-center text-xs font-bold"
						style="color: {isLight(hex) ? '#000' : '#fff'}"
					>
						✓
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="mt-3 flex items-center gap-2">
		<input
			type="color"
			bind:value={customColor}
			class="h-8 w-8 cursor-pointer rounded border border-brand-light"
		/>
		<button
			type="button"
			onclick={() => addColor(customColor)}
			class="rounded-md bg-brand-bg px-2.5 py-1.5 text-xs font-medium text-brand-dark ring-1 ring-brand-light transition-colors hover:bg-brand-light/30"
		>
			Add Custom Color
		</button>
	</div>

	{#if colors.length > 0}
		<div class="mt-3 space-y-1.5">
			{#each colors as color (color)}
				<div class="flex items-center justify-between rounded-md bg-brand-bg px-2.5 py-1.5 text-sm">
					<span class="flex items-center gap-2">
						<span
							class="h-4 w-4 shrink-0 rounded-full ring-1 ring-brand-light"
							style="background-color: {color}"
						></span>
						<span class="text-brand-dark">{getColorName(color)}</span>
						<span class="text-xs text-brand-mid">{color.toUpperCase()}</span>
					</span>
					<button
						type="button"
						onclick={() => removeColor(color)}
						title="Remove {getColorName(color)}"
						class="text-brand-mid hover:text-red-600"
					>
						✕
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-3 text-xs text-brand-mid">
			No colors selected — this product will show without color options.
		</p>
	{/if}

	<input type="hidden" {name} value={JSON.stringify(colors)} />
</div>
