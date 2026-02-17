<script>
	let { data, children } = $props();
</script>

<div class="flex min-h-[80vh]">
	<!-- Admin Sidebar -->
	<aside class="w-64 border-r border-gray-200 bg-white px-6 py-8">
		<div class="flex items-center gap-2 mb-8 px-2">
			<h2 class="text-sm font-bold tracking-wider text-gray-500 uppercase">Admin</h2>
		</div>
		<nav class="space-y-1">
			<a
				href="/admin"
				class="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent hover:border-gray-900 transition-all"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
				</span>
				Dashboard
			</a>
			<a
				href="/admin/add"
				class="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent hover:border-gray-900 transition-all"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
				</span>
				Add Product
			</a>
			<a
				href="/admin/quotes"
				class="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent hover:border-gray-900 transition-all"
			>
				<span class="mr-3 text-gray-400 group-hover:text-gray-500">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clip-rule="evenodd" /></svg>
				</span>
				Add Quote
			</a>
		</nav>
		<div class="mt-auto pt-8 border-t border-gray-100">
			{#if data.user?.email}
				<div class="mb-4 flex items-center px-3">
					<div class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
						{data.user.email[0].toUpperCase()}
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-700 max-w-[120px] truncate">{data.user.email}</p>
					</div>
				</div>
			{/if}
			<form method="POST" action="/login?/logout">
				<button type="submit" class="w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors">
					<span class="mr-3 text-gray-400 group-hover:text-red-500">
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" /></svg>
					</span>
					Sign Out
				</button>
			</form>
		</div>
	</aside>

	<!-- Admin Content -->
	<div class="flex-1 p-6">
		{@render children()}
	</div>
</div>
