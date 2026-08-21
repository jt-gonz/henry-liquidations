<!-- Admin Analytics Dashboard -->
<script>
	let { data } = $props();

	/** @type {any} */
	let stats = $derived(/** @type {any} */ (data).stats);

	const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
	const number = new Intl.NumberFormat('en-US');

	/** @param {number} n */
	function fmtCurrency(n) {
		return currency.format(n ?? 0);
	}

	/** @param {number} n */
	function fmtNumber(n) {
		return number.format(n ?? 0);
	}

	/** @param {string} isoDate e.g. 2026-08-14 */
	function fmtShortDate(isoDate) {
		const [, month, day] = isoDate.split('-');
		return `${Number(month)}/${Number(day)}`;
	}

	let dailyViews = $derived(stats?.traffic?.dailyViews ?? []);
	let dailyRevenue = $derived(stats?.orders?.dailyRevenue ?? []);

	let maxViews = $derived(Math.max(1, ...dailyViews.map((/** @type {any} */ d) => d.count)));
	let maxRevenue = $derived(Math.max(1, ...dailyRevenue.map((/** @type {any} */ d) => d.total)));

	/** Show a date label under the first, middle, and last bar only, to avoid crowding. */
	function isLabeledIndex(/** @type {number} */ i, /** @type {number} */ len) {
		return i === 0 || i === len - 1 || i === Math.floor(len / 2);
	}
</script>

<div class="px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-brand-dark">Analytics</h1>
		<p class="mt-1 text-sm text-brand-mid">Traffic and customer behavior, last 30 days.</p>
	</div>

	<!-- ── Key Metrics ─────────────────────────────────────────── -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Visitors</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">
				{fmtNumber(stats.traffic.uniqueVisitors30d)}
			</p>
			<p class="mt-1 text-xs text-brand-mid">{fmtNumber(stats.traffic.uniqueVisitors7d)} in last 7d</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Page Views</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">{fmtNumber(stats.traffic.pageViews30d)}</p>
			<p class="mt-1 text-xs text-brand-mid">{fmtNumber(stats.traffic.pageViews7d)} in last 7d</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Revenue</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">{fmtCurrency(stats.orders.revenue30d)}</p>
			<p class="mt-1 text-xs text-brand-mid">{fmtCurrency(stats.orders.revenue7d)} in last 7d</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Orders</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">{fmtNumber(stats.orders.orders30d)}</p>
			<p class="mt-1 text-xs text-brand-mid">{fmtNumber(stats.orders.orders7d)} in last 7d</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Avg Order Value</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">
				{fmtCurrency(stats.orders.avgOrderValue30d)}
			</p>
			<p class="mt-1 text-xs text-brand-mid">&nbsp;</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<p class="text-xs font-medium tracking-wide text-brand-mid uppercase">Conversion Rate</p>
			<p class="mt-1 text-2xl font-bold text-brand-dark">{stats.conversionRate30d.toFixed(1)}%</p>
			<p class="mt-1 text-xs text-brand-mid">Visitors who ordered</p>
		</div>
	</div>

	<!-- ── Charts ───────────────────────────────────────────────── -->
	<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold text-brand-dark">Daily traffic (14 days)</h2>
			<div class="mt-4 flex h-32 items-end gap-1">
				{#each dailyViews as day, i (day.date)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div
							class="w-full rounded-t bg-brand-mid/70 transition-all hover:bg-brand-mid"
							style="height: {Math.max(3, (day.count / maxViews) * 100)}%"
							title="{day.date}: {fmtNumber(day.count)} views"
						></div>
						<span class="h-3 text-[10px] text-brand-mid">
							{isLabeledIndex(i, dailyViews.length) ? fmtShortDate(day.date) : ''}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold text-brand-dark">Daily revenue (14 days)</h2>
			<div class="mt-4 flex h-32 items-end gap-1">
				{#each dailyRevenue as day, i (day.date)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div
							class="w-full rounded-t bg-brand-brown/70 transition-all hover:bg-brand-brown"
							style="height: {Math.max(3, (day.total / maxRevenue) * 100)}%"
							title="{day.date}: {fmtCurrency(day.total)}"
						></div>
						<span class="h-3 text-[10px] text-brand-mid">
							{isLabeledIndex(i, dailyRevenue.length) ? fmtShortDate(day.date) : ''}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- ── Top Pages / Top Products ────────────────────────────── -->
	<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold text-brand-dark">Top pages (30 days)</h2>
			{#if stats.traffic.topPages.length === 0}
				<p class="mt-4 text-sm text-brand-mid">No traffic recorded yet.</p>
			{:else}
				<ul class="mt-3 divide-y divide-brand-light/50">
					{#each stats.traffic.topPages as page (page.path)}
						<li class="flex items-center justify-between py-2 text-sm">
							<span class="truncate pr-2 text-brand-dark">{page.path}</span>
							<span class="shrink-0 font-medium text-brand-mid">{fmtNumber(page.count)} views</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="rounded-lg bg-white p-4 shadow ring-1 ring-brand-light/50">
			<h2 class="text-sm font-bold text-brand-dark">Top products (30 days)</h2>
			{#if stats.orders.topProducts.length === 0}
				<p class="mt-4 text-sm text-brand-mid">No sales recorded yet.</p>
			{:else}
				<ul class="mt-3 divide-y divide-brand-light/50">
					{#each stats.orders.topProducts as product (product.name)}
						<li class="flex items-center justify-between py-2 text-sm">
							<span class="truncate pr-2 text-brand-dark">{product.name}</span>
							<span class="shrink-0 font-medium text-brand-mid">
								{fmtNumber(product.quantity)} sold · {fmtCurrency(product.revenue)}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
