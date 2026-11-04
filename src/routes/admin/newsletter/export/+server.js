import { supabaseAdmin } from '$lib/server/supabase.js';

/** @param {string} value */
function csvEscape(value) {
	const str = String(value ?? '');
	if (/[",\n]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * GET /admin/newsletter/export
 *
 * Full CSV export of newsletter subscribers (no pagination — this is a
 * one-shot download, not a page load).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET() {
	const { data: subscribers, error } = await supabaseAdmin
		.from('newsletter_subscribers')
		.select('email, source, created_at')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to export newsletter subscribers:', error.message);
		return new Response('Failed to export subscribers.', { status: 500 });
	}

	const rows = [
		['email', 'source', 'signed_up_at'],
		...(subscribers ?? []).map((s) => [s.email, s.source ?? '', s.created_at])
	];
	const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
}
