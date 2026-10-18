<script>
	import './layout.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { page } from '$app/stores';

	injectAnalytics();

	let { children } = $props();

	// Sitewide LocalBusiness structured data — NAP matches Footer.svelte.
	let localBusinessJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FurnitureStore',
			name: "Henry's Liquidation Store",
			url: $page.url.origin + '/',
			telephone: '+1-765-977-2492',
			email: 'support@henrysliquidation.com',
			priceRange: '$$',
			address: {
				'@type': 'PostalAddress',
				streetAddress: '1355 Sagamore Pkwy N',
				addressLocality: 'Lafayette',
				addressRegion: 'IN',
				postalCode: '47904',
				addressCountry: 'US'
			},
			openingHoursSpecification: [
				{
					'@type': 'OpeningHoursSpecification',
					dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
					opens: '10:00',
					closes: '19:00'
				},
				{
					'@type': 'OpeningHoursSpecification',
					dayOfWeek: ['Friday', 'Saturday'],
					opens: '10:00',
					closes: '20:00'
				},
				{
					'@type': 'OpeningHoursSpecification',
					dayOfWeek: 'Sunday',
					opens: '10:00',
					closes: '20:00'
				}
			]
		})
	);
</script>

<svelte:head>
	<!-- Baseline fallback — routes with their own <svelte:head> override these per-field. -->
	<title>Henry's Liquidation Store | Furniture &amp; Appliances at Liquidation Prices</title>
	<meta
		name="description"
		content="Shop overstock and liquidation furniture and appliances at up to 70% off retail in Lafayette, IN."
	/>
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
	<link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
	<link
		rel="apple-touch-icon-precomposed"
		sizes="180x180"
		href="/apple-touch-icon-precomposed.png?v=3"
	/>
	<link rel="shortcut icon" href="/favicon.ico?v=3" />
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#2B2420" />
	{@html `<script type="application/ld+json">${localBusinessJsonLd}</script>`}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

