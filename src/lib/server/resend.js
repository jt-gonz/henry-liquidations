import { env } from '$env/dynamic/private';

/**
 * Sends an email via the Resend HTTP API directly (no SDK dependency —
 * this is a single POST with a bearer token).
 *
 * Reads RESEND_API_KEY via $env/dynamic/private (not /static) on purpose —
 * this key is optional until the Resend account is set up, and the static
 * form fails the entire production build if a referenced var is unset.
 *
 * @param {{ from: string, to: string, subject: string, html: string }} params
 * @returns {Promise<{ id: string }>}
 */
export async function sendEmail({ from, to, subject, html }) {
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is not configured.');
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ from, to, subject, html })
	});

	const body = await res.json();

	if (!res.ok) {
		throw new Error(`Resend API error (${res.status}): ${body?.message ?? JSON.stringify(body)}`);
	}

	return body;
}
