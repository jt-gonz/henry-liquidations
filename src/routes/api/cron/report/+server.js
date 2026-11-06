import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/server/supabase.js';
import { getReportStats } from '$lib/server/reportStats.js';
import { toISODate } from '$lib/server/reportPeriods.js';
import { renderReportEmail } from '$lib/server/reportEmail.js';
import { sendEmail } from '$lib/server/resend.js';

const SITE_NAME = "Henry's Liquidation Store";

/** Maps a Vercel Cron schedule expression (see vercel.json) to the report it triggers.
 * @type {Record<string, 'week' | 'month' | 'quarter'>} */
const SCHEDULE_TO_PERIOD = {
	'0 8 * * 1': 'week',
	'0 8 1 * *': 'month',
	'0 8 1 1,4,7,10 *': 'quarter'
};

/**
 * GET /api/cron/report
 *
 * Triggered by Vercel Cron (see vercel.json — one entry per cadence,
 * all pointing at this same path). Vercel sends the firing schedule in
 * `x-vercel-cron-schedule`, which is how one endpoint serves all three
 * cadences. A `?period=` query param is also accepted so this can be
 * triggered manually (locally, or for a one-off resend) without
 * needing to fake that header.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ request, url }) {
	const authHeader = request.headers.get('authorization');
	if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	// The email side (Resend account + domain verification) isn't set up
	// yet — fail fast with a clear reason rather than computing stats we
	// can't do anything with, or inserting a 'reports' row with no real
	// recipient.
	if (!env.REPORT_TO_EMAIL || !env.RESEND_FROM_EMAIL) {
		return json(
			{ error: 'Report email is not configured yet (RESEND_FROM_EMAIL / REPORT_TO_EMAIL).' },
			{ status: 503 }
		);
	}

	const scheduleHeader = request.headers.get('x-vercel-cron-schedule') ?? '';
	const period = /** @type {'week' | 'month' | 'quarter' | undefined} */ (
		url.searchParams.get('period') ?? SCHEDULE_TO_PERIOD[scheduleHeader]
	);

	if (period !== 'week' && period !== 'month' && period !== 'quarter') {
		return json({ error: 'Could not determine report period.' }, { status: 400 });
	}

	const { bounds, metrics } = await getReportStats(period);

	const periodStartISO = toISODate(bounds.start);
	const periodEndISO = toISODate(bounds.end);

	// Idempotency: Vercel Cron delivery is best-effort and can fire the
	// same scheduled run more than once — never send the same report twice.
	const { data: existing } = await supabaseAdmin
		.from('reports')
		.select('id')
		.eq('period_type', period)
		.eq('period_start', periodStartISO)
		.eq('status', 'sent')
		.maybeSingle();

	if (existing) {
		return json({ skipped: true, reason: 'already sent for this period' });
	}

	try {
		const html = renderReportEmail({ siteName: SITE_NAME, kind: bounds.kind, label: bounds.label, metrics });
		const subject = `${bounds.kind} report — ${SITE_NAME} — ${bounds.label}`;

		await sendEmail({ from: env.RESEND_FROM_EMAIL, to: env.REPORT_TO_EMAIL, subject, html });

		await supabaseAdmin.from('reports').insert({
			period_type: period,
			period_start: periodStartISO,
			period_end: periodEndISO,
			metrics,
			recipient: env.REPORT_TO_EMAIL,
			status: 'sent'
		});

		return json({ sent: true, period, label: bounds.label });
	} catch (err) {
		console.error('Owner report generation/send failed:', err);
		await supabaseAdmin.from('reports').insert({
			period_type: period,
			period_start: periodStartISO,
			period_end: periodEndISO,
			metrics: metrics ?? {},
			recipient: env.REPORT_TO_EMAIL,
			status: 'failed',
			error_message: String(/** @type {any} */ (err)?.message ?? err)
		});
		return json({ error: 'Failed to generate or send report.' }, { status: 500 });
	}
}
