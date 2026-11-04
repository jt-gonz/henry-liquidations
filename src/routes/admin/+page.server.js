import { redirect } from '@sveltejs/kit';

// The bare /admin route used to render its own duplicate, less-capable
// product list (see /admin/inventory, which has search/filtering, stats,
// and inline stock editing). It's kept only as a redirect so old
// bookmarks/links to /admin still land somewhere useful.
export function load() {
	throw redirect(307, '/admin/analytics');
}
