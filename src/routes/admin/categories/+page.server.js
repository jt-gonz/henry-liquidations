import { fail } from '@sveltejs/kit';
import { supabase, supabaseAdmin } from '$lib/server/supabase.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const { data: categories, error } = await supabaseAdmin
		.from('categories')
		.select('*')
		.order('sort_order', { ascending: true });

	if (error) {
		console.error('Error loading categories:', error);
		return { categories: [] };
	}

	return { categories: categories ?? [] };
}

/** @type {import('./$types').Actions} */
export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const value = formData.get('value')?.toString().trim();
		const label = formData.get('label')?.toString().trim();
		const sort_order = parseInt(formData.get('sort_order')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on';

		if (!value || !label) {
			return fail(400, {
				error: 'Value and label are required',
				value,
				label,
				sort_order,
				is_active
			});
		}

		// Convert value to uppercase with underscores
		const normalizedValue = value.toUpperCase().replace(/\s+/g, '_');

		const { error } = await /** @type {any} */ (supabaseAdmin)
			.from('categories')
			.insert([{ value: normalizedValue, label, sort_order, is_active }]);

		if (error) {
			if (error.code === '23505') {
				return fail(400, {
					error: `Category "${normalizedValue}" already exists`,
					value,
					label,
					sort_order,
					is_active
				});
			}
			console.error('Error creating category:', error);
			return fail(500, { error: 'Failed to create category', value, label, sort_order, is_active });
		}

		return { success: `Category "${label}" created successfully` };
	},

	update: async ({ request }) => {
		const formData = await request.formData();

		const id = formData.get('id')?.toString();
		const label = formData.get('label')?.toString().trim();
		const sort_order = parseInt(formData.get('sort_order')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on';

		if (!id || !label) {
			return fail(400, { error: 'ID and label are required' });
		}

		const { error } = await /** @type {any} */ (supabaseAdmin)
			.from('categories')
			.update({ label, sort_order, is_active })
			.eq('id', id);

		if (error) {
			console.error('Error updating category:', error);
			return fail(500, { error: 'Failed to update category' });
		}

		return { success: `Category updated successfully` };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Category ID is required' });
		}

		const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

		if (error) {
			console.error('Error deleting category:', error);
			return fail(500, { error: 'Failed to delete category' });
		}

		return { success: 'Category deleted successfully' };
	}
};
