<script>
	import './layout.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=2" />
	<link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
	<link
		rel="apple-touch-icon-precomposed"
		sizes="180x180"
		href="/apple-touch-icon-precomposed.png?v=2"
	/>
	<link rel="shortcut icon" href="/favicon.ico?v=2" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

