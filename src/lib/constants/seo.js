/**
 * Sitewide default social share image, used by routes without a more
 * specific one (product pages use the product's own photo instead).
 * A site-relative path — callers must prefix it with `$page.url.origin`
 * (og:image/twitter:image require an absolute URL).
 */
export const DEFAULT_OG_IMAGE = '/icon-512.png';
