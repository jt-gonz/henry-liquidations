import { supabaseAdmin } from '$lib/server/supabase.js';

const PAGE_SIZE = 25;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const {
		data: subscribers,
		error,
		count
	} = await supabaseAdmin
		.from('newsletter_subscribers')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) {
		console.error('Failed to load newsletter subscribers:', error.message);
		return { subscribers: [], page: 1, totalPages: 1, totalCount: 0, from: 0, to: 0 };
	}

	const totalCount = count ?? 0;

	return {
		subscribers: subscribers ?? [],
		page,
		totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
		totalCount,
		from,
		to: Math.min(to, totalCount - 1)
	};
}
