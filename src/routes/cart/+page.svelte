<!-- Cart Page -->
<script>
	import { cart, removeFromCart, updateQuantity, clearCart } from '$lib/stores/cart.js';
	import { onMount } from 'svelte';

	let items = $derived($cart);
	let total = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let itemCount = $derived(items.reduce((sum, item) => sum + item.quantity, 0));

	let checkingOut = $state(false);
	let checkoutError = $state('');

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
				const productMap = new Map(products.map((p) => [p.id, p]));

				cart.update((currentItems) => {
					return currentItems.map((item) => {
						const fresh = productMap.get(item.id);
						if (!fresh) return item; // Keep as is if verification fails (or remove?)
						
						// Update details
						return {
							...item,
							price: Number(fresh.price),
							name: fresh.name,
							image_url: fresh.image_url,
							slug: fresh.slug,
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
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: items.map((item) => ({ id: item.id, quantity: item.quantity }))
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

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold text-gray-900">Your Cart</h1>

	{#if items.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">Your cart is empty.</p>
			<a
				href="/shop"
				class="mt-4 inline-block rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Browse Products
			</a>
		</div>
	{:else}
		<div class="divide-y divide-gray-200 border-t border-b border-gray-200">
			{#each items as item (item.color ? `${item.id}-${item.color}` : item.id)}
				<div class="flex items-center gap-4 py-4">
					<!-- Thumbnail -->
					<a href="/product/{item.slug}" class="shrink-0 relative">
						<img src={item.image_url} alt={item.name} class="h-20 w-20 rounded-md object-cover" />
						{#if item.color}
							<div
								class="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-gray-200"
								style="background-color: {item.color}"
								title="Color: {item.color}"
							></div>
						{/if}
					</a>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<a
							href="/product/{item.slug}"
							class="text-sm font-medium text-gray-900 hover:underline"
						>
							{item.name}
						</a>
						<p class="mt-1 text-sm text-gray-600">${item.price.toFixed(2)}</p>
					</div>

					<!-- Quantity Controls -->
					<div class="flex items-center gap-2">
						<button
							onclick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
							class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
							aria-label="Decrease quantity"
						>
							-
						</button>
						<span class="w-8 text-center text-sm font-medium">{item.quantity}</span>
						<button
							onclick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
							class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
							aria-label="Increase quantity"
						>
							+
						</button>
					</div>

					<!-- Line total -->
					<p class="w-20 text-right text-sm font-medium text-gray-900">
						${(item.price * item.quantity).toFixed(2)}
					</p>

					<!-- Remove -->
					<button
						onclick={() => removeFromCart(item.id, item.color)}
						class="text-sm text-red-600 hover:text-red-800"
						aria-label="Remove {item.name}"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>

		<!-- Cart Summary -->
		<div class="mt-6 flex items-center justify-between">
			<button onclick={() => clearCart()} class="text-sm text-gray-500 hover:text-gray-700">
				Clear Cart
			</button>
			<div class="text-right">
				<p class="text-sm text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
				<p class="text-xl font-bold text-gray-900">${total.toFixed(2)}</p>
			</div>
		</div>

		<!-- Checkout -->
		<div class="mt-6">
			{#if checkoutError}
				<p class="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{checkoutError}</p>
			{/if}
			<button
				onclick={handleCheckout}
				disabled={checkingOut}
				class="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{checkingOut ? 'Redirecting to Stripe…' : 'Proceed to Checkout'}
			</button>
			<p class="mt-2 text-center text-xs text-gray-500">Secure checkout powered by Stripe</p>
		</div>
	{/if}
</div>
