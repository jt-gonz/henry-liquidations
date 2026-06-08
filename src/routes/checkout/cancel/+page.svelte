<!-- Checkout Cancel Page -->
<script>
	import { onMount } from 'svelte';
	import { track } from '@vercel/analytics';

	onMount(() => {
		// Track checkout cancellation
		track('checkout_cancelled', {
			timestamp: new Date().toISOString()
		});
	});
</script>

<div class="mx-auto max-w-xl px-4 py-24 text-center">
	<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
		<svg class="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<h1 class="mt-6 text-3xl font-bold text-gray-900">Order Cancelled</h1>
	<p class="mt-4 text-lg text-gray-600">Your order was not processed. No charges have been made.</p>
	<a
		href="/cart"
		class="mt-10 inline-block rounded-lg bg-gray-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-gray-700"
	>
		Return to Cart
	</a>
</div>
