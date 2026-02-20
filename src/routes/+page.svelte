<!-- Home Page: Landing / welcome page -->
<script>
	let { data } = $props();
	let quotes = $derived(/** @type {any[]} */ (data.quotes) ?? []);
	let currentSlide = $state(0);

	/** @type {ReturnType<typeof setInterval> | undefined} */
	let autoPlay;

	function nextSlide() {
		if (quotes.length === 0) return;
		currentSlide = (currentSlide + 1) % quotes.length;
	}

	function prevSlide() {
		if (quotes.length === 0) return;
		currentSlide = (currentSlide - 1 + quotes.length) % quotes.length;
	}

	$effect(() => {
		if (quotes.length <= 1) return;
		autoPlay = setInterval(nextSlide, 5000);
		return () => clearInterval(autoPlay);
	});
</script>

<div class="relative isolate overflow-hidden">
	<!-- Hero Section -->
	<div class="mx-auto max-w-7xl px-6 pt-2 pb-24 sm:pb-28 lg:flex lg:px-8 lg:py-20">
		<div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
			<div class="mt-24 sm:mt-28 lg:mt-16">
				<a
					href="#visit-us"
					class="inline-flex items-center gap-1.5 rounded-full bg-brand-mid/10 px-3 py-1 text-md leading-6 font-semibold text-brand-mid ring-1 ring-brand-mid/10 ring-inset"
				>
					<span>Visit us</span>
					<svg
						class="h-4 w-4 text-brand-mid"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.387 1.445-.966 2.274-1.765C15.302 15.088 17 12.843 17 10a7 7 0 10-14 0c0 2.843 1.698 5.088 3.354 6.585a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
			</div>
			<h1 class="mt-5 text-4xl font-bold tracking-tight text-brand-dark sm:text-6xl">
				Liquidation Prices.<br />Premium Quality.
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600">
				Discover incredible deals on high-end furniture. We source overstock and liquidation items
				to bring you luxury for less.
			</p>
			<div class="mt-10 flex items-center gap-x-6">
				<a
					href="/shop"
					class="rounded-md bg-brand-dark px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
					>Shop Collection</a
				>
				<a href="#features" class="text-sm leading-6 font-semibold text-brand-dark"
					>Learn more <span aria-hidden="true">→</span></a
				>
			</div>
		</div>
		<div
			class="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none xl:ml-32"
		>
			<div class="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
				<div
					class="-m-2 rounded-xl bg-brand-dark/5 p-2 ring-1 ring-brand-dark/10 ring-inset lg:-m-4 lg:rounded-2xl lg:p-4"
				>
					<img
						src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
						alt="Furniture showcase"
						class="w-[55rem] rounded-md shadow-2xl ring-1 ring-brand-dark/10"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Value Propositions -->
	<section id="features" class="mx-auto mt-12 max-w-7xl px-6 pb-20 lg:px-8">
		<div class="mx-auto max-w-2xl lg:text-center">
			<h2 class="text-base leading-7 font-semibold text-brand-mid">Why Choose Us</h2>
			<p class="mt-2 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
				Everything you need, nothing you don't
			</p>
			<p class="mt-6 text-lg leading-8 text-gray-600">
				We keep our overhead low so we can pass the savings directly to you.
			</p>
		</div>
		<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
			<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-6 lg:max-w-none lg:grid-cols-2 lg:gap-y-8">
				<div class="relative pl-16">
					<dt class="text-sm leading-6 font-semibold text-brand-dark">
						<div
							class="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark"
						>
							<span class="text-lg font-bold text-white">%</span>
						</div>
						Unbeatable Prices
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">
						Save up to 70% off retail prices on brand new and like-new furniture.
					</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm leading-6 font-semibold text-brand-dark">
						<div
							class="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark"
						>
							<span class="text-lg text-white">✓</span>
						</div>
						Quality Guaranteed
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">
						Every piece is hand-inspected by our team to ensure it meets our strict quality
						standards.
					</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm leading-6 font-semibold text-brand-dark">
						<div
							class="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark"
						>
							<span class="text-lg text-white">↻</span>
						</div>
						Instant Availability
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">
						If it's on the site, it's in our warehouse. No waiting weeks for delivery.
					</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm leading-6 font-semibold text-brand-dark">
						<div
							class="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark"
						>
							<span class="text-lg text-white">🔒</span>
						</div>
						Secure Checkout
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">
						Transactions are encrypted and processed securely by Stripe.
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<!-- Visit Us / Contact Section -->
	<section id="visit-us" class="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
		<div class="mx-auto max-w-2xl lg:text-center">
			<h2 class="text-base leading-7 font-semibold text-brand-mid">Find Us</h2>
			<p class="mt-2 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
				Visit Our Showroom
			</p>
			<p class="mt-6 text-lg leading-8 text-gray-600">
				Come see our furniture in person. We're open and ready to help you find the perfect piece.
			</p>
		</div>

		<div class="mx-auto mt-12 max-w-5xl lg:flex lg:gap-12">
			<!-- Contact info -->
			<div class="flex flex-col justify-center gap-6 lg:w-64 lg:flex-shrink-0">
				<!-- Phone (highlighted) -->
				<div class="rounded-2xl bg-brand-dark px-6 py-5 text-center shadow-lg">
					<p class="text-xs font-semibold tracking-widest text-brand-light uppercase">Call Us</p>
					<a
						href="tel:+17659772492"
						class="mt-2 block text-3xl font-bold tracking-tight text-white transition-colors hover:text-brand-light"
					>
						(765) 977-2492
					</a>
					<p class="mt-1 text-xs text-brand-light">Tap to call</p>
				</div>

				<!-- Address -->
				<div class="rounded-2xl bg-brand-bg px-6 py-5 ring-1 ring-brand-light">
					<p class="text-xs font-semibold tracking-widest text-brand-mid uppercase">Address</p>
					<address class="mt-2 not-italic">
						<p class="text-base font-semibold text-brand-dark">Henry's Liquidation Store</p>
						<p class="mt-1 text-sm leading-6 text-gray-600">
							1355 Sagamore Pkwy N<br />
							Lafayette, IN 47904
						</p>
					</address>
					<a
						href="https://maps.google.com/?q=1355+Sagamore+Pkwy+N,+Lafayette,+IN+47904"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-mid transition-colors hover:text-brand-dark"
					>
						Get directions
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
								clip-rule="evenodd"
							/>
							<path
								fill-rule="evenodd"
								d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
				</div>
			</div>

			<!-- Map embed -->
			<div
				class="mt-8 flex-1 overflow-hidden rounded-2xl shadow-lg ring-1 ring-brand-light lg:mt-0"
			>
				<iframe
					title="Henry's Liquidation Store location"
					src="https://maps.google.com/maps?q=1355+Sagamore+Pkwy+N,+Lafayette,+IN+47904&output=embed"
					width="100%"
					height="360"
					style="border:0;"
					allowfullscreen
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
			</div>
		</div>
	</section>

	<!-- Customer Quotes / Testimonials Slider -->
	{#if quotes.length > 0}
		<section class="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
			<div class="mx-auto max-w-2xl lg:text-center">
				<h2 class="text-base leading-7 font-semibold text-brand-mid">Testimonials</h2>
				<p class="mt-2 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
					What Our Customers Say
				</p>
			</div>
			<div class="relative mx-auto mt-16 max-w-2xl">
				<!-- Slide Container -->
				<div
					class="flex min-h-[180px] flex-col justify-center overflow-hidden rounded-2xl bg-brand-bg p-8 ring-1 ring-brand-light sm:p-12"
				>
					{#each quotes as q, i (q.id)}
						{#if i === currentSlide}
							<div class="animate-fade-in flex flex-col items-center">
								<div class="mb-4 text-4xl leading-none font-bold text-brand-dark">"</div>
								<blockquote class="text-center">
									<p class="text-lg leading-8 text-gray-600 italic">"{q.quote}"</p>
								</blockquote>
								<div class="mt-6 flex items-center justify-center gap-x-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white"
									>
										{q.reviewer.charAt(0).toUpperCase()}
									</div>
									<div class="text-sm font-semibold text-brand-dark">{q.reviewer}</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Navigation Arrows -->
				{#if quotes.length > 1}
					<button
						onclick={prevSlide}
						class="absolute top-1/2 left-0 flex h-9 w-9 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-mid shadow-md ring-1 ring-brand-light transition-colors hover:text-brand-dark"
						aria-label="Previous quote"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"
							><path
								fill-rule="evenodd"
								d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
								clip-rule="evenodd"
							/></svg
						>
					</button>
					<button
						onclick={nextSlide}
						class="absolute top-1/2 right-0 flex h-9 w-9 translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-mid shadow-md ring-1 ring-brand-light transition-colors hover:text-brand-dark"
						aria-label="Next quote"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"
							><path
								fill-rule="evenodd"
								d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
								clip-rule="evenodd"
							/></svg
						>
					</button>
				{/if}

				<!-- Dots -->
				{#if quotes.length > 1}
					<div class="mt-6 flex justify-center gap-2">
						{#each quotes as _, i}
							<button
								onclick={() => {
									currentSlide = i;
								}}
								class="h-2 w-2 rounded-full transition-all {i === currentSlide
									? 'w-6 bg-brand-dark'
									: 'bg-brand-light hover:bg-brand-mid'}"
								aria-label="Go to quote {i + 1}"
							></button>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
