<!-- Home Page: Landing / welcome page -->
<script>
	let { data } = $props();
	let quotes = $derived(data.quotes ?? []);
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
	<div class="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-20">
		<div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
			<div class="mt-24 sm:mt-32 lg:mt-16">
				<a href="/shop" class="inline-flex items-center space-x-6">
					<span class="rounded-full bg-red-600/10 px-3 py-1 text-sm font-semibold leading-6 text-red-600 ring-1 ring-inset ring-red-600/10">Latest Arrivals</span>
					<span class="inline-flex items-center gap-1.5 text-sm font-medium leading-6 text-gray-600">
						<span>Just landed</span>
						<svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
						</svg>
					</span>
				</a>
			</div>
			<h1 class="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Liquidation Prices.<br/>Premium Quality.
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600">
				Discover incredible deals on high-end furniture. We source overstock and liquidation items to bring you luxury for less.
			</p>
			<div class="mt-10 flex items-center gap-x-6">
				<a href="/shop" class="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">Shop Collection</a>
				<a href="#features" class="text-sm font-semibold leading-6 text-gray-900">Learn more <span aria-hidden="true">→</span></a>
			</div>
		</div>
		<div class="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
			<div class="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
				<div class="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
					<img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" alt="Furniture showcase" class="w-[55rem] rounded-md shadow-2xl ring-1 ring-gray-900/10" />
				</div>
			</div>
		</div>
	</div>

	<!-- Value Propositions -->
	<section id="features" class="mx-auto mt-12 max-w-7xl px-6 lg:px-8 pb-20">
		<div class="mx-auto max-w-2xl lg:text-center">
			<h2 class="text-base font-semibold leading-7 text-red-600">Why Choose Us</h2>
			<p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need, nothing you don't</p>
			<p class="mt-6 text-lg leading-8 text-gray-600">We keep our overhead low so we can pass the savings directly to you.</p>
		</div>
		<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
			<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-6 lg:max-w-none lg:grid-cols-2 lg:gap-y-8">
				<div class="relative pl-16">
					<dt class="text-sm font-semibold leading-6 text-gray-900">
						<div class="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
							<span class="text-white text-lg font-bold">%</span>
						</div>
						Unbeatable Prices
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">Save up to 70% off retail prices on brand new and like-new furniture.</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm font-semibold leading-6 text-gray-900">
						<div class="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
							<span class="text-white text-lg">✓</span>
						</div>
						Quality Guaranteed
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">Every piece is hand-inspected by our team to ensure it meets our strict quality standards.</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm font-semibold leading-6 text-gray-900">
						<div class="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
							<span class="text-white text-lg">↻</span>
						</div>
						Instant Availability
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">If it's on the site, it's in our warehouse. No waiting weeks for delivery.</dd>
				</div>
				<div class="relative pl-16">
					<dt class="text-sm font-semibold leading-6 text-gray-900">
						<div class="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
							<span class="text-white text-lg">🔒</span>
						</div>
						Secure Checkout
					</dt>
					<dd class="mt-1 text-sm leading-6 text-gray-600">Transactions are encrypted and processed securely by Stripe.</dd>
				</div>
			</dl>
		</div>
	</section>

	<!-- Customer Quotes / Testimonials Slider -->
	{#if quotes.length > 0}
		<section class="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
			<div class="mx-auto max-w-2xl lg:text-center">
				<h2 class="text-base font-semibold leading-7 text-red-600">Testimonials</h2>
				<p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">What Our Customers Say</p>
			</div>
			<div class="relative mx-auto mt-16 max-w-2xl">
				<!-- Slide Container -->
				<div class="overflow-hidden rounded-2xl bg-gray-50 p-8 sm:p-12 ring-1 ring-gray-200 min-h-[180px] flex flex-col justify-center">
					{#each quotes as q, i (q.id)}
						{#if i === currentSlide}
							<div class="animate-fade-in flex flex-col items-center">
								<div class="mb-4 text-4xl text-red-600 font-bold leading-none">“</div>
								<blockquote class="text-center">
									<p class="text-lg leading-8 text-gray-600 italic">"{q.quote}"</p>
								</blockquote>
								<div class="mt-6 flex items-center justify-center gap-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold text-sm">
										{q.reviewer.charAt(0).toUpperCase()}
									</div>
									<div class="text-sm font-semibold text-gray-900">{q.reviewer}</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Navigation Arrows -->
				{#if quotes.length > 1}
					<button
						onclick={prevSlide}
						class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
						aria-label="Previous quote"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" /></svg>
					</button>
					<button
						onclick={nextSlide}
						class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
						aria-label="Next quote"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
					</button>
				{/if}

				<!-- Dots -->
				{#if quotes.length > 1}
					<div class="mt-6 flex justify-center gap-2">
						{#each quotes as _, i }
							<button
								onclick={() => { currentSlide = i; }}
								class="h-2 w-2 rounded-full transition-all {i === currentSlide ? 'bg-red-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}"
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
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
