<!-- Checkout Success Page -->
<script>
	import { onMount } from 'svelte';
	import { clearCart } from '$lib/stores/cart.js';
	import { track } from '@vercel/analytics';

	onMount(() => {
		// Track successful purchase
		track('purchase_completed', {
			timestamp: new Date().toISOString()
		});
		clearCart();
	});
</script>

<div class="mx-auto max-w-xl px-4 py-24 text-center">
	<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
		<svg class="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<h1 class="mt-6 text-3xl font-bold text-gray-900">Thank you for your purchase!</h1>
	<p class="mt-4 text-lg text-gray-600">
		Your order has been placed successfully. We'll have it ready for you shortly.
	</p>
	<a
		href="/"
		class="mt-10 inline-block rounded-lg bg-gray-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-gray-700"
	>
		Continue Shopping
	</a>
</div>
