<script>
	import Button from '$lib/components/ui/Button.svelte';

	/** @type {{ source?: string, class?: string }} */
	let { source = undefined, class: className = '' } = $props();

	let email = $state('');
	let status = $state(/** @type {'idle' | 'loading' | 'success' | 'error'} */ ('idle'));
	let errorMessage = $state('');

	async function handleSubmit(/** @type {SubmitEvent} */ event) {
		event.preventDefault();
		if (status === 'loading') return;

		status = 'loading';
		errorMessage = '';

		try {
			const res = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, source })
			});
			const data = await res.json();

			if (!res.ok) {
				status = 'error';
				errorMessage = data.error || 'Something went wrong. Please try again.';
				return;
			}

			status = 'success';
			email = '';
		} catch {
			status = 'error';
			errorMessage = 'Network error. Please check your connection and try again.';
		}
	}
</script>

<div class={className}>
	{#if status === 'success'}
		<p class="text-sm text-brand-light">You're subscribed! Watch your inbox for new arrivals.</p>
	{:else}
		<form onsubmit={handleSubmit} class="flex flex-col gap-2 sm:flex-row">
			<label for="newsletter-email" class="sr-only">Email address</label>
			<input
				id="newsletter-email"
				type="email"
				bind:value={email}
				required
				placeholder="you@example.com"
				class="min-w-0 flex-1 rounded-md border border-brand-mid/40 bg-white/10 px-3 py-2 text-sm text-white placeholder-brand-light/60 focus:border-brand-light focus:ring-1 focus:ring-brand-light focus:outline-none"
			/>
			<Button type="submit" variant="primary" size="sm" disabled={status === 'loading'}>
				{status === 'loading' ? 'Subscribing…' : 'Subscribe'}
			</Button>
		</form>
		{#if status === 'error'}
			<p class="mt-2 text-sm text-red-300">{errorMessage}</p>
		{/if}
	{/if}
</div>
