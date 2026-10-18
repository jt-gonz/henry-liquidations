/**
 * Shared between client components and server code (unlike
 * src/lib/server/productFilters.js, which can't be imported client-side) —
 * washers & dryers have no `categories` row, so this is the single
 * reserved URL slug for their /shop/{slug} landing page.
 */
export const WASHER_DRYER_SLUG = 'washers-dryers';
