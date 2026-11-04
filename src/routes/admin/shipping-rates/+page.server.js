import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const { data: rates, error } = await supabaseAdmin
		.from('shipping_rates')
		.select('*')
		.order('sort_order', { ascending: true });

	if (error) {
		console.error('Error loading shipping rates:', error);
		return { rates: [] };
	}

	return { rates: rates ?? [] };
}

/**
 * Parses and validates the shared fields between create/update.
 * @param {FormData} formData
 */
function parseRateForm(formData) {
	const label = formData.get('label')?.toString().trim();
	const fee = Number(formData.get('fee'));
	const sort_order = parseInt(formData.get('sort_order')?.toString() || '0', 10);
	const is_active = formData.get('is_active') === 'on';
	const is_fallback = formData.get('is_fallback') === 'on';
	const zip_start_raw = formData.get('zip_start')?.toString().trim();
	const zip_end_raw = formData.get('zip_end')?.toString().trim();

	if (!label) return { error: 'Label is required.' };
	if (isNaN(fee) || fee < 0) return { error: 'Fee must be a non-negative number.' };

	if (is_fallback) {
		// Fallback rows ignore ZIP bounds entirely, regardless of what the
		// (hidden) form fields contain — defense in depth.
		return { label, fee, sort_order, is_active, is_fallback, zip_start: null, zip_end: null };
	}

	const zip_start = parseInt(zip_start_raw ?? '', 10);
	const zip_end = parseInt(zip_end_raw ?? '', 10);
	if (!zip_start_raw || !zip_end_raw || isNaN(zip_start) || isNaN(zip_end)) {
		return { error: 'Start and end ZIP are required for a non-fallback range.' };
	}
	if (zip_start > zip_end) {
		return { error: 'Start ZIP must be less than or equal to end ZIP.' };
	}

	return { label, fee, sort_order, is_active, is_fallback, zip_start, zip_end };
}

/** @type {import('./$types').Actions} */
export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const parsed = parseRateForm(formData);

		if ('error' in parsed) {
			return fail(400, { error: parsed.error });
		}

		const { error } = await /** @type {any} */ (supabaseAdmin).from('shipping_rates').insert([parsed]);

		if (error) {
			if (error.code === '23505') {
				return fail(400, {
					error: 'Only one fallback rate can be active. Deactivate or edit the existing one first.'
				});
			}
			console.error('Error creating shipping rate:', error);
			return fail(500, { error: 'Failed to create shipping rate.' });
		}

		return { success: `Shipping rate "${parsed.label}" created successfully.` };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { error: 'Shipping rate ID is required.' });

		const parsed = parseRateForm(formData);
		if ('error' in parsed) {
			return fail(400, { error: parsed.error });
		}

		const { error } = await /** @type {any} */ (supabaseAdmin)
			.from('shipping_rates')
			.update(parsed)
			.eq('id', id);

		if (error) {
			if (error.code === '23505') {
				return fail(400, {
					error: 'Only one fallback rate can be active. Deactivate or edit the existing one first.'
				});
			}
			console.error('Error updating shipping rate:', error);
			return fail(500, { error: 'Failed to update shipping rate.' });
		}

		return { success: 'Shipping rate updated successfully.' };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Shipping rate ID is required.' });
		}

		const { error } = await supabaseAdmin.from('shipping_rates').delete().eq('id', id);

		if (error) {
			console.error('Error deleting shipping rate:', error);
			return fail(500, { error: 'Failed to delete shipping rate.' });
		}

		return { success: 'Shipping rate deleted successfully.' };
	}
};
