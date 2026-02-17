<script>
	let { open = $bindable(false) } = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex justify-end">
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="absolute inset-0 bg-black/30" onclick={() => (open = false)}></div>

		<!-- Drawer -->
		<div class="relative w-full max-w-md bg-white p-6 shadow-xl">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Your Cart</h2>
				<button class="text-gray-400 hover:text-gray-600" onclick={() => (open = false)}>
					&times;
				</button>
			</div>
			<div class="mt-6">
				<p class="text-sm text-gray-500">Your cart is empty.</p>
			</div>
		</div>
	</div>
{/if}
