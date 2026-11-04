<!-- Login Page -->
<script>
	import Button from '$lib/components/ui/Button.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Manager Login | Henry's Liquidation Store</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center bg-brand-bg px-4 py-12">
	<div class="w-full max-w-sm rounded-xl bg-white p-8 shadow-card ring-1 ring-brand-light/50">
		<h1 class="mb-6 text-center text-2xl font-bold text-brand-dark">Manager Login</h1>

		{#if form?.error}
			<div class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form method="POST" action="?/login" class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-brand-dark">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					value={form?.email ?? ''}
					class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-brand-dark">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="mt-1 block w-full rounded-md border border-brand-light px-3 py-2 shadow-sm focus:border-brand-brown focus:ring-1 focus:ring-brand-brown focus:outline-none sm:text-sm"
				/>
			</div>
			<Button type="submit" variant="primary" class="w-full">Sign In</Button>
		</form>
	</div>
</div>
