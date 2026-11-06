<script>
	import './layout.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { page } from '$app/stores';
	import { PUBLIC_SUPABASE_URL, PUBLIC_CLARITY_PROJECT_ID } from '$env/static/public';

	injectAnalytics();

	let { children } = $props();

	// Admin is an internal tool, not a marketing page — the full storefront
	// footer (About Us blurb, contact info, etc.) is unnecessary scroll
	// length and noise there.
	let isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));
	let showFooter = $derived(!isAdminRoute);

	// Microsoft Clarity (heatmaps, scrollmaps, session replay, rage-click
	// detection) — see the Design Signal Playbook. Public storefront only —
	// excludes /admin and /login, same posture as page_views tracking in
	// hooks.server.js — and inert until PUBLIC_CLARITY_PROJECT_ID is set.
	let showClarity = $derived(
		!isAdminRoute && $page.url.pathname !== '/login' && !!PUBLIC_CLARITY_PROJECT_ID
	);

	// Sitewide LocalBusiness structured data — NAP matches Footer.svelte.
	let localBusinessJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FurnitureStore',
			name: "Henry's Liquidation Store",
			url: $page.url.origin + '/',
			logo: $page.url.origin + '/icon-512.png',
			image: $page.url.origin + '/icon-512.png',
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
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=4" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=4" />
	<link rel="icon" type="image/x-icon" href="/favicon.ico?v=4" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
	<link
		rel="apple-touch-icon-precomposed"
		sizes="180x180"
		href="/apple-touch-icon-precomposed.png?v=4"
	/>
	<link rel="shortcut icon" href="/favicon.ico?v=4" />
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#2B2420" />
	<!-- Product photos are served from Supabase storage — preconnect so the
	     first above-the-fold image (hero/ProductCard) doesn't pay full
	     DNS+TLS latency on top of the request itself. -->
	<link rel="preconnect" href={PUBLIC_SUPABASE_URL} crossorigin="anonymous" />
	<link rel="dns-prefetch" href={PUBLIC_SUPABASE_URL} />
	{@html `<script type="application/ld+json">${localBusinessJsonLd}</script>`}
	{#if showClarity}
		{@html `<script type="text/javascript">
			(function(c,l,a,r,i,t,y){
				c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
				t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
				y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
			})(window, document, "clarity", "script", "${PUBLIC_CLARITY_PROJECT_ID}");
		</script>`}
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	{#if showFooter}
		<Footer />
	{/if}
</div>
