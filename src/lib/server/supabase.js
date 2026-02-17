import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * @typedef {import('$lib/types/database.js').Database} Database
 */

/**
 * Public Supabase client — respects Row Level Security.
 * Use this for public data queries (e.g. reading products).
 * @type {import('@supabase/supabase-js').SupabaseClient<Database>}
 */
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

/**
 * Admin Supabase client — bypasses Row Level Security.
 * Use this ONLY on the server for privileged operations (e.g. writing orders).
 * @type {import('@supabase/supabase-js').SupabaseClient<Database>}
 */
export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
