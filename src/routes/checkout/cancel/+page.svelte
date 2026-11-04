<!-- Checkout Cancel Page -->
<script>
	import { onMount } from 'svelte';
	import { track } from '@vercel/analytics';
	import Button from '$lib/components/ui/Button.svelte';

	onMount(() => {
		// Track checkout cancellation
		track('checkout_cancelled', {
			timestamp: new Date().toISOString()
		});
	});
</script>

<svelte:head>
	<title>Order Cancelled | Henry's Liquidation Store</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-24 text-center">
	<div
		class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-light/50 ring-1 ring-brand-light"
	>
		<svg class="h-8 w-8 text-brand-mid" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<h1 class="mt-6 text-3xl font-bold text-brand-dark">Order Cancelled</h1>
	<p class="mt-4 text-lg text-brand-mid">
		Your order was not processed. No charges have been made.
	</p>
	<Button href="/cart" size="lg" pill class="mt-10">Return to Cart</Button>
</div>
