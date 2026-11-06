<script>
	import Logo from '$lib/components/Logo.svelte';
</script>

<footer class="mt-auto border-t border-brand-light bg-brand-dark">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<Logo variant="stacked" class="mb-10 text-brand-bg" />
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div>
				<h3 class="text-sm font-semibold tracking-wider text-brand-bg uppercase">About Us</h3>
				<p class="mt-4 text-base text-brand-light">
					Henry's Liquidation Store offers the best deals on premium furniture. Quality items at
					unbeatably low prices.
				</p>
			</div>
			<div>
				<h3 class="text-sm font-semibold tracking-wider text-brand-bg uppercase">
					Customer Service
				</h3>
				<ul class="mt-4 space-y-4">
					<li><a href="/shop" class="text-base text-brand-light hover:text-white">Shop All</a></li>
					<li><a href="/cart" class="text-base text-brand-light hover:text-white">My Cart</a></li>
					<li>
						<a href="/shipping-policy" class="text-base text-brand-light hover:text-white"
							>Shipping Policy</a
						>
					</li>
				</ul>
			</div>
			<div>
				<h3 class="text-sm font-semibold tracking-wider text-brand-bg uppercase">Contact</h3>
				<ul class="mt-4 space-y-4">
					<li class="flex items-center gap-2.5 text-base text-brand-light">
						<svg
							class="h-4 w-4 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.75"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 6.75c0-.414.336-.75.75-.75h18a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-18a.75.75 0 01-.75-.75V6.75z"
							/>
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7l9 6 9-6" />
						</svg>
						support@henrysliquidation.com
					</li>
					<li class="flex items-center gap-2.5 text-base text-brand-light">
						<svg
							class="h-4 w-4 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.75"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 4.5c0-.414.336-.75.75-.75h3a.75.75 0 01.75.65c.12.936.345 1.845.67 2.712a.75.75 0 01-.168.79l-1.2 1.2a12.06 12.06 0 005.4 5.4l1.2-1.2a.75.75 0 01.79-.168c.867.325 1.776.55 2.712.67a.75.75 0 01.65.76v3a.75.75 0 01-.75.75H19.5A15.75 15.75 0 013.75 6.75V4.5z"
							/>
						</svg>
						(765) 977-2492
					</li>
					<li class="flex items-center gap-2.5 text-base text-brand-light">
						<svg
							class="h-4 w-4 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.75"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
							/>
						</svg>
						1355 Sagamore Pkwy N, Lafayette, IN 47904
					</li>
				</ul>
			</div>
		</div>
		<div class="mt-12 border-t border-brand-mid pt-8 text-center">
			<p class="text-sm text-brand-light">
				&copy; {new Date().getFullYear()} Henry's Liquidation Store. All rights reserved.
			</p>
		</div>
	</div>
</footer>
