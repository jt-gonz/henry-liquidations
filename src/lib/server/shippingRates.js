/**
 * ZIP-based shipping fee lookup. Single source of truth used by both the
 * pre-checkout quote endpoint and checkout itself, so the fee a customer
 * sees before paying always matches what they're actually charged.
 */

/** @param {string} zipInput @returns {number | null} */
function normalizeZip(zipInput) {
	const digits = String(zipInput ?? '').replace(/\D/g, '').slice(0, 5);
	if (digits.length !== 5) return null;
	return parseInt(digits, 10);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} zipInput
 * @returns {Promise<{ fee: number, label: string, rateId: string } | { error: string }>}
 */
export async function getShippingFeeForZip(client, zipInput) {
	const zip = normalizeZip(zipInput);
	if (zip === null) {
		return { error: 'Please enter a valid 5-digit ZIP code.' };
	}

	const { data: rates, error } = await client
		.from('shipping_rates')
		.select('id, label, zip_start, zip_end, fee, is_fallback')
		.eq('is_active', true)
		.order('sort_order', { ascending: true });

	if (error) {
		console.error('Failed to load shipping rates:', error.message);
		return { error: 'Could not calculate shipping right now. Please try again.' };
	}

	const rows = rates ?? [];

	for (const rate of rows) {
		if (rate.is_fallback) continue;
		if (rate.zip_start === null || rate.zip_end === null) continue;
		if (zip >= rate.zip_start && zip <= rate.zip_end) {
			return { fee: Number(rate.fee), label: rate.label, rateId: rate.id };
		}
	}

	const fallback = rows.find((r) => r.is_fallback);
	if (fallback) {
		return { fee: Number(fallback.fee), label: fallback.label, rateId: fallback.id };
	}

	return {
		error: 'Shipping is not available for this ZIP code yet. Please contact us or choose in-store pickup.'
	};
}
