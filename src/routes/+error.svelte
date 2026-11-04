<script>
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';

	let status = $derived($page.status);
	let isNotFound = $derived(status === 404);
</script>

<svelte:head>
	<title>{isNotFound ? 'Page Not Found' : 'Something Went Wrong'} | Henry's Liquidation Store</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
	<p class="text-sm font-semibold tracking-wide text-brand-brown uppercase">Error {status}</p>
	<h1 class="mt-3 text-3xl font-bold text-brand-dark sm:text-4xl">
		{isNotFound ? "We couldn't find that page" : 'Something went wrong'}
	</h1>
	<p class="mt-3 text-brand-mid">
		{isNotFound
			? "The page you're looking for doesn't exist or may have moved."
			: 'An unexpected error occurred. Please try again.'}
	</p>
	<div class="mt-8 flex flex-col gap-3 sm:flex-row">
		<Button href="/" variant="primary">Back to Home</Button>
		<Button href="/shop" variant="outline">Browse Shop</Button>
	</div>
</div>
