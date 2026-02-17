/**
 * Quick smoke test for Phase 2 Supabase setup.
 *
 * Run with:  npx dotenvx run -- bun scripts/test-supabase.js
 *
 * Tests:
 *  1. Anon client can SELECT from products (public read)
 *  2. Anon client CANNOT INSERT into products (write blocked)
 *  3. Anon client CANNOT SELECT from orders (no policy)
 *  4. Admin client CAN INSERT + SELECT + DELETE from orders
 *  5. Storage bucket "product-images" exists
 */

import { createClient } from '@supabase/supabase-js';

// env vars are injected by dotenvx at runtime

const URL = process.env.PUBLIC_SUPABASE_URL;
const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
	console.error('Missing env vars. Check your .env file.');
	process.exit(1);
}

const anon = createClient(URL, ANON);
const admin = createClient(URL, SERVICE);

let passed = 0;
let failed = 0;

function ok(label) {
	passed++;
	console.log(`  PASS  ${label}`);
}
function fail(label, detail) {
	failed++;
	console.error(`  FAIL  ${label} — ${detail}`);
}

console.log('\n--- Phase 2: Supabase smoke tests ---\n');

// 1. Anon can read products
{
	const { data, error } = await anon.from('products').select('*').limit(1);
	if (error) fail('Anon SELECT products', error.message);
	else ok('Anon SELECT products (public read)');
}

// 2. Anon cannot insert into products
{
	const { error } = await anon.from('products').insert({
		name: '__test__',
		slug: '__test__',
		price: 0
	});
	if (error) ok('Anon INSERT products blocked (expected)');
	else {
		fail('Anon INSERT products', 'should have been blocked by RLS');
		// clean up
		await admin.from('products').delete().eq('slug', '__test__');
	}
}

// 3. Anon cannot read orders
{
	const { data, error } = await anon.from('orders').select('*').limit(1);
	if (error) ok('Anon SELECT orders blocked (expected)');
	else if (data && data.length === 0) {
		// RLS returns empty array rather than error in some configs
		ok('Anon SELECT orders returns empty (RLS active)');
	} else {
		fail('Anon SELECT orders', 'should return empty or error');
	}
}

// 4. Admin can write + read + delete orders
{
	const { data: inserted, error: insertErr } = await admin
		.from('orders')
		.insert({
			customer_email: 'test@test.com',
			items: [
				{ product_id: '00000000-0000-0000-0000-000000000000', name: 'Test', price: 1, quantity: 1 }
			],
			payment_status: 'pending'
		})
		.select()
		.single();

	if (insertErr) {
		fail('Admin INSERT orders', insertErr.message);
	} else {
		ok('Admin INSERT orders');

		const { data: rows, error: selErr } = await admin
			.from('orders')
			.select('*')
			.eq('id', inserted.id);
		if (selErr || !rows?.length) fail('Admin SELECT orders', selErr?.message || 'no rows');
		else ok('Admin SELECT orders');

		const { error: delErr } = await admin.from('orders').delete().eq('id', inserted.id);
		if (delErr) fail('Admin DELETE orders', delErr.message);
		else ok('Admin DELETE test order (cleanup)');
	}
}

// 5. Storage bucket exists
{
	const { data, error } = await admin.storage.getBucket('product-images');
	if (error) fail('Storage bucket "product-images"', error.message);
	else ok(`Storage bucket "product-images" exists (public: ${data.public})`);
}

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
