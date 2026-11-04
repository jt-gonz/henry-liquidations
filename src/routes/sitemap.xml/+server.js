import { supabase } from '$lib/server/supabase.js';
import { WASHER_DRYER_SLUG } from '$lib/server/productFilters.js';

/** @param {string} path @param {string} [lastmod] */
function urlEntry(path, lastmod) {
	return `\t<url>\n\t\t<loc>${path}</loc>\n${lastmod ? `\t\t<lastmod>${lastmod}</lastmod>\n` : ''}\t</url>`;
}

/**
 * Dynamically generated sitemap — every product, every category landing
 * page, and the static content pages. Crawlers don't need to scroll
 * through /shop's client-side infinite scroll to discover products; this
 * hands every product URL directly.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url }) {
	const origin = url.origin;

	const [{ data: products }, { data: categories }] = await Promise.all([
		supabase.from('products').select('slug, created_at').order('created_at', { ascending: false }),
		supabase.from('categories').select('slug').eq('is_active', true).not('slug', 'is', null)
	]);

	// Listing pages change whenever the newest product does — reuse that as
	// their lastmod rather than tracking a separate "page last changed" date.
	const newestProductDate = products?.[0]?.created_at?.slice(0, 10);

	const staticEntries = [
		urlEntry(`${origin}/`, newestProductDate),
		urlEntry(`${origin}/shop`, newestProductDate),
		urlEntry(`${origin}/shipping-policy`)
	];

	const categoryEntries = [
		...(categories ?? []).map((c) => urlEntry(`${origin}/shop/${c.slug}`, newestProductDate)),
		urlEntry(`${origin}/shop/${WASHER_DRYER_SLUG}`, newestProductDate)
	];

	const productEntries = (products ?? []).map((p) =>
		urlEntry(`${origin}/product/${p.slug}`, p.created_at?.slice(0, 10))
	);

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...categoryEntries, ...productEntries].join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
}
