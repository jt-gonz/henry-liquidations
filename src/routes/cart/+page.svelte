<!-- Cart Page -->
<script>
	import { cart, removeFromCart, updateQuantity, clearCart } from '$lib/stores/cart.js';
	import { onMount } from 'svelte';
	import { getColorName } from '$lib/constants/colors.js';
	import { track } from '@vercel/analytics';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	let hasShippingRates = $derived(data.hasShippingRates);

	let items = $derived($cart);
	let total = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let itemCount = $derived(items.reduce((sum, item) => sum + item.quantity, 0));

	const PLACEHOLDER_IMAGE =
		'data:image/svg+xml;utf8,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#FBF3E9"/><g fill="none" stroke="#8A7A6D" stroke-width="2"><path d="M20 52l12-12a4 4 0 015 0l12 12m-6-6l4-4a4 4 0 015 0l8 8" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="18" width="48" height="44" rx="4"/><circle cx="30" cy="30" r="3"/></g></svg>'
		);

	/** @param {Event} event */
	function handleImageError(event) {
		const img = /** @type {HTMLImageElement} */ (event.currentTarget);
		img.onerror = null;
		img.src = PLACEHOLDER_IMAGE;
	}

	let checkingOut = $state(false);
	let checkoutError = $state('');

	let fulfillment = $state(/** @type {'pickup' | 'ship'} */ ('pickup'));
	let zip = $state('');
	let shippingQuote = $state(/** @type {{ fee: number, label: string } | null} */ (null));
	let quoteError = $state('');
	let quoting = $state(false);

	let orderTotal = $derived(
		fulfillment === 'ship' && shippingQuote ? total + shippingQuote.fee : total
	);

	function selectFulfillment(/** @type {'pickup' | 'ship'} */ method) {
		fulfillment = method;
		if (method === 'pickup') {
			shippingQuote = null;
			quoteError = '';
		}
	}

	async function checkShippingCost() {
		if (!/^\d{5}$/.test(zip)) {
			quoteError = 'Please enter a valid 5-digit ZIP code.';
			shippingQuote = null;
			return;
		}

		quoting = true;
		quoteError = '';
		shippingQuote = null;

		try {
			const res = await fetch('/api/shipping-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ zip })
			});
			const data = await res.json();

			if (!res.ok) {
				quoteError = data.error || 'Could not calculate shipping. Please try again.';
				return;
			}

			shippingQuote = { fee: data.fee, label: data.label };
		} catch {
			quoteError = 'Network error. Please check your connection and try again.';
		} finally {
			quoting = false;
		}
	}

	const pageTitle = "Your Cart | Henry's Liquidation Store";

	onMount(async () => {
		if ($cart.length === 0) return;

		try {
			const res = await fetch('/api/products/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: $cart.map((i) => i.id) })
			});

			if (res.ok) {
				const { products } = await res.json();
				// Create a map for O(1) lookup
				/** @type {Map<string, any>} */
				const productMap = new Map(products.map(/** @param {any} p */ (p) => [String(p.id), p]));

				cart.update((currentItems) => {
					return currentItems.map((item) => {
						const fresh = productMap.get(item.id);
						if (!fresh) return item; // Keep as is if verification fails (or remove?)

						// Update details
						return {
							...item,
							price: Number(fresh.price),
							name: fresh.name,
							image_url: fresh.image_url?.[0] ?? item.image_url,
							slug: fresh.slug
							// Optional: handle out of stock logic here if desired
						};
					});
				});
			}
		} catch (err) {
			console.error('Failed to sync cart prices:', err);
		}
	});

	async function handleCheckout() {
		checkingOut = true;
		checkoutError = '';

		try {
			// Track checkout initiation
			track('checkout_initiated', {
				item_count: itemCount,
				total_value: total,
				// track() only allows flat property values, not arrays/objects.
				cart_items: JSON.stringify(
					items.map((item) => ({
						product_id: item.id,
						product_name: item.name,
						quantity: item.quantity,
						price: item.price
					}))
				)
			});

			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: items.map((item) => ({
						id: item.id,
						quantity: item.quantity,
						...(item.color ? { color: item.color } : {})
					})),
					fulfillmentMethod: fulfillment,
					...(fulfillment === 'ship' ? { zip } : {})
				})
			});

			const data = await res.json();

			if (!res.ok) {
				checkoutError = data.error || 'Something went wrong. Please try again.';
				return;
			}

			// Redirect to Stripe Checkout
			if (data.url) {
				window.location.href = data.url;
				return; // keep spinner active while redirecting
			}

			checkoutError = 'No checkout URL returned. Please try again.';
		} catch {
			checkoutError = 'Network error. Please check your connection and try again.';
		} finally {
			if (checkoutError) {
				checkingOut = false;
			}
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content="Review the items in your cart and check out securely." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold text-brand-dark">Your Cart</h1>

	{#if items.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-brand-light bg-brand-bg px-6 py-24 text-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="mb-6 h-20 w-20 text-brand-light"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
				/>
			</svg>
			<p class="text-2xl font-bold text-brand-dark">Your cart is empty.</p>
			<p class="mt-2 text-brand-mid">Looks like you haven't added anything to your cart yet.</p>
			<Button href="/shop" size="lg" pill class="mt-8">Browse Products</Button>
		</div>
	{:else}
		<div class="divide-y divide-brand-light border-t border-b border-brand-light">
			{#each items as item (item.color ? `${item.id}-${item.color}` : item.id)}
				<div class="flex items-center gap-4 py-4">
					<!-- Thumbnail -->
					<a href="/product/{item.slug}" class="relative shrink-0">
						<img
							src={item.image_url}
							alt={item.name}
							class="h-20 w-20 rounded-md bg-brand-bg object-cover"
							onerror={handleImageError}
						/>
						<!-- {#if item.color} -->
						<!-- 	<div -->
						<!-- 		class="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-gray-200" -->
						<!-- 		style="background-color: {item.color}" -->
						<!-- 		title="Color: {item.color}" -->
						<!-- 	></div> -->
						<!-- {/if} -->
					</a>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<a
							href="/product/{item.slug}"
							class="text-sm font-bold text-brand-dark hover:underline"
						>
							{item.name}
						</a>
						<p class="mt-1 text-sm font-medium text-brand-brown">${item.price.toFixed(2)}</p>
						{#if item.color}
							<div class="mt-1 flex items-center gap-1.5">
								<span class="text-xs text-brand-mid">Color:</span>
								<div
									class="h-3 w-3 rounded-full border border-brand-light"
									style="background-color: {item.color}"
								></div>
								<span class="text-xs text-brand-mid">{getColorName(item.color)}</span>
							</div>
						{/if}
					</div>

					<!-- Quantity Controls -->
					<div class="flex items-center gap-2">
						<button
							onclick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
							class="flex h-8 w-8 items-center justify-center rounded border border-brand-light text-brand-dark hover:bg-brand-bg"
							aria-label="Decrease quantity"
						>
							-
						</button>
						<span class="w-8 text-center text-sm font-bold text-brand-dark">{item.quantity}</span>
						<button
							onclick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
							class="flex h-8 w-8 items-center justify-center rounded border border-brand-light text-brand-dark hover:bg-brand-bg"
							aria-label="Increase quantity"
						>
							+
						</button>
					</div>

					<!-- Line total -->
					<p class="w-20 text-right text-sm font-bold text-brand-brown">
						${(item.price * item.quantity).toFixed(2)}
					</p>

					<!-- Remove -->
					<button
						onclick={() => removeFromCart(item.id, item.color)}
						class="text-sm text-brand-brown hover:text-brand-dark"
						aria-label="Remove {item.name}"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>

		<!-- Cart Summary -->
		<div class="mt-6 flex items-center justify-between">
			<button onclick={() => clearCart()} class="text-sm text-brand-mid hover:text-brand-dark">
				Clear Cart
			</button>
			<div class="text-right">
				<p class="text-sm text-brand-mid">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
				{#if fulfillment === 'ship' && shippingQuote}
					<p class="text-sm text-brand-mid">Subtotal: ${total.toFixed(2)}</p>
					<p class="text-sm text-brand-mid">
						{shippingQuote.label}: ${shippingQuote.fee.toFixed(2)}
					</p>
				{/if}
				<p class="text-xl font-bold text-brand-dark">${orderTotal.toFixed(2)}</p>
			</div>
		</div>

		<!-- Fulfillment: pickup vs ship -->
		<div class="mt-6 rounded-lg border border-brand-light p-4">
			<p class="mb-3 text-sm font-bold text-brand-dark">
				How would you like to receive your order?
			</p>
			<div class="flex flex-col gap-2 sm:flex-row">
				<label
					class="flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm {fulfillment ===
					'pickup'
						? 'border-brand-brown bg-brand-brown/5 text-brand-dark'
						: 'border-brand-light text-brand-mid'}"
				>
					<input
						type="radio"
						name="fulfillment"
						value="pickup"
						checked={fulfillment === 'pickup'}
						onchange={() => selectFulfillment('pickup')}
						class="text-brand-brown focus:ring-brand-brown"
					/>
					Pick up in store (Free)
				</label>
				{#if hasShippingRates}
					<label
						class="flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm {fulfillment ===
						'ship'
							? 'border-brand-brown bg-brand-brown/5 text-brand-dark'
							: 'border-brand-light text-brand-mid'}"
					>
						<input
							type="radio"
							name="fulfillment"
							value="ship"
							checked={fulfillment === 'ship'}
							onchange={() => selectFulfillment('ship')}
							class="text-brand-brown focus:ring-brand-brown"
						/>
						Ship to me
					</label>
				{:else}
					<div
						class="flex flex-1 cursor-not-allowed items-center gap-2 rounded-md border border-brand-light px-3 py-2 text-sm text-brand-mid/60"
						title="Shipping isn't available yet — please pick up in store or contact us."
					>
						Ship to me <span class="text-xs">(unavailable — contact us)</span>
					</div>
				{/if}
			</div>

			{#if fulfillment === 'ship'}
				<div class="mt-3 flex items-end gap-2">
					<div class="flex-1">
						<label for="zip" class="mb-1 block text-xs font-medium text-brand-mid">ZIP Code</label>
						<input
							type="text"
							id="zip"
							bind:value={zip}
							inputmode="numeric"
							maxlength="5"
							placeholder="e.g. 12345"
							class="w-full rounded-md border border-brand-light px-3 py-2 text-sm placeholder:text-brand-mid/60 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none"
						/>
					</div>
					<button
						onclick={checkShippingCost}
						disabled={quoting}
						class="rounded-md border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
					>
						{quoting ? 'Checking…' : 'Check shipping cost'}
					</button>
				</div>
				{#if quoteError}
					<p class="mt-2 text-sm text-red-700">{quoteError}</p>
				{/if}
			{/if}
		</div>

		<!-- Checkout -->
		<div class="mt-6">
			{#if checkoutError}
				<p class="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{checkoutError}</p>
			{/if}
			<Button
				onclick={handleCheckout}
				disabled={checkingOut || (fulfillment === 'ship' && !shippingQuote)}
				size="lg"
				class="w-full"
			>
				{checkingOut
					? 'Redirecting to Stripe…'
					: fulfillment === 'ship' && !shippingQuote
						? 'Check shipping cost to continue'
						: 'Proceed to Checkout'}
			</Button>
			<p class="mt-2 text-center text-xs text-brand-mid">Secure checkout powered by Stripe</p>
		</div>
	{/if}
</div>
