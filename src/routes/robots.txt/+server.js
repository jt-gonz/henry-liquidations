/**
 * Dynamic robots.txt so the Sitemap: line always matches the real request
 * origin (no production domain is hardcoded anywhere in this codebase).
 *
 * /admin, /api, and /login are excluded outright — nothing crawlable or
 * indexable there. /cart and /checkout/* are deliberately NOT disallowed
 * here; they carry a `noindex` meta tag instead so Google can still see
 * that directive rather than indexing a bare, description-less URL.
 *
 * @type {import('./$types').RequestHandler}
 */
export function GET({ url }) {
	const body = `User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /login
Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
