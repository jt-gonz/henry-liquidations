<!-- Privacy Policy -->
<script>
	import { page } from '$app/stores';
	import { DEFAULT_OG_IMAGE } from '$lib/constants/seo.js';

	const pageTitle = "Privacy Policy | Henry's Liquidation Store";
	const pageDescription =
		"How Henry's Liquidation Store collects, uses, and protects your information.";
	let ogImage = $derived($page.url.origin + DEFAULT_OG_IMAGE);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={$page.url.origin + '/privacy-policy'} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:url" content={$page.url.origin + '/privacy-policy'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16 sm:px-8">
	<h1 class="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">Privacy Policy</h1>
	<p class="mt-3 text-sm text-gray-500"><strong>Last updated:</strong> November 2026</p>
	<p class="mt-4 text-base leading-7 text-gray-600">
		This page explains what information <strong class="text-brand-dark"
			>Henry's Liquidation Store</strong
		> collects when you visit or buy from us, why we collect it, and who we share it with. We don't
		sell your information to anyone.
	</p>

	<div class="mt-10 space-y-10">
		<!-- 1 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">1. Information You Give Us</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				When you place an order, checkout is handled by <strong class="text-brand-dark"
					>Stripe</strong
				>, our payment processor. We receive your name, email, and shipping address (for
				delivery orders) so we can fulfill and follow up on your order. We never see or store your
				full card number — Stripe handles that directly.
			</p>
			<p class="mt-3 text-base leading-7 text-gray-600">
				If you email or call us, we keep that correspondence to respond to your question or
				request.
			</p>
		</section>

		<!-- 2 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">2. Information Collected Automatically</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				Like most websites, we collect some information automatically to understand how the site
				is used and to keep it working well:
			</p>
			<ul class="mt-3 list-outside list-disc space-y-3 pl-5 text-base leading-7 text-gray-600">
				<li>
					<strong class="text-brand-dark">Basic traffic analytics.</strong> We log which pages are
					viewed and, when you search our catalog, what you searched for — tied to an anonymous,
					randomly generated id stored in a cookie on your browser, never to your name or email.
					This helps us see which products and searches aren't turning up good results.
				</li>
				<li>
					<strong class="text-brand-dark">Session recordings and heatmaps (Microsoft Clarity).</strong>
					We use
					<a
						href="https://clarity.microsoft.com"
						target="_blank"
						rel="noopener noreferrer"
						class="text-brand-mid underline hover:text-brand-dark">Microsoft Clarity</a
					>
					to record anonymized mouse movement, clicks, scrolling, and page interactions, and to build
					aggregate heatmaps of how visitors use our pages. Clarity masks the content of form fields
					by default, so what you type into the checkout or search box is never captured as text. See
					Microsoft's
					<a
						href="https://www.microsoft.com/privacy/privacystatement"
						target="_blank"
						rel="noopener noreferrer"
						class="text-brand-mid underline hover:text-brand-dark">Privacy Statement</a
					> for how Microsoft itself handles this data.
				</li>
				<li>
					<strong class="text-brand-dark">Hosting analytics (Vercel).</strong> Our hosting provider,
					Vercel, collects standard aggregate traffic metrics (page views, approximate device type)
					for every site it hosts. See
					<a
						href="https://vercel.com/legal/privacy-policy"
						target="_blank"
						rel="noopener noreferrer"
						class="text-brand-mid underline hover:text-brand-dark">Vercel's Privacy Policy</a
					>.
				</li>
			</ul>
		</section>

		<!-- 3 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">3. Cookies</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				We use a small number of cookies: one anonymous id (described above) that lets us count
				unique visitors without identifying you, your shopping cart (stored in your browser, not
				on our servers), and cookies set by Microsoft Clarity to recognize a return visit within
				the same session. We don't use advertising or cross-site retargeting cookies.
			</p>
		</section>

		<!-- 4 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">4. How We Use This Information</h2>
			<ul class="mt-3 list-outside list-disc space-y-2 pl-5 text-base leading-7 text-gray-600">
				<li>To process and fulfill your order, and contact you about it if needed</li>
				<li>To respond to questions you send us</li>
				<li>
					To understand how shoppers actually use the site — what gets searched for, scrolled
					past, or clicked on — so we can fix what's confusing and improve the catalog and layout
				</li>
			</ul>
		</section>

		<!-- 5 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">5. Who We Share Information With</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				We share information only with the service providers that help us run the store, each
				bound to use it only for that purpose:
			</p>
			<ul class="mt-3 list-outside list-disc space-y-2 pl-5 text-base leading-7 text-gray-600">
				<li><strong class="text-brand-dark">Stripe</strong> — payment processing</li>
				<li><strong class="text-brand-dark">Supabase</strong> — our database host</li>
				<li><strong class="text-brand-dark">Vercel</strong> — our web host</li>
				<li><strong class="text-brand-dark">Microsoft Clarity</strong> — behavior analytics</li>
			</ul>
			<p class="mt-3 text-base leading-7 text-gray-600">
				We don't sell, rent, or trade your information to any third party for marketing purposes.
			</p>
		</section>

		<!-- 6 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">6. Your Choices</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				You can clear your browser's cookies at any time, which resets the anonymous id described
				above. Microsoft offers a separate opt-out for its analytics products through the
				<a
					href="https://optout.aboutads.info/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-brand-mid underline hover:text-brand-dark">Digital Advertising Alliance</a
				>. If you'd like us to delete information we hold about you, contact us below and we'll
				take care of it.
			</p>
		</section>

		<!-- 7 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">7. Children's Privacy</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				Our site is intended for a general audience and isn't directed at children. We don't
				knowingly collect personal information from children under 13.
			</p>
		</section>

		<!-- 8 -->
		<section>
			<h2 class="text-xl font-bold text-brand-dark">8. Changes to This Policy</h2>
			<p class="mt-3 text-base leading-7 text-gray-600">
				If we change what we collect or how we use it, we'll update this page and the "Last
				updated" date above.
			</p>
		</section>

		<!-- Contact -->
		<section class="rounded-xl bg-brand-bg px-6 py-10 ring-1 ring-brand-light">
			<h2 class="text-xl font-bold text-brand-dark">Contact Us</h2>
			<p class="mt-2 text-base leading-7 text-gray-600">
				Questions about this policy, or want your information deleted? Reach out:
			</p>
			<ul class="mt-3 space-y-2 text-base text-gray-600">
				<li class="flex items-center gap-2">
					<span class="text-brand-mid">📧</span>
					<a
						href="mailto:support@henrysliquidation.com"
						class="text-brand-mid underline hover:text-brand-dark"
					>
						support@henrysliquidation.com
					</a>
				</li>
				<li class="flex items-center gap-2">
					<span class="text-brand-mid">📞</span>
					<a href="tel:+17659772492" class="text-brand-mid underline hover:text-brand-dark">
						(765) 977-2492
					</a>
				</li>
			</ul>
		</section>
	</div>
</div>
