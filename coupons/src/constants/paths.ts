/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const couponsListPath = () => MODULE_ROOT

export const couponAddPath = () => '/add'

/**
 * Coupon codes may contain `#`, `/` or `?` (MD test data uses `SALE#1`), so the
 * code is URL-encoded into a single path segment; `useParams` decodes it.
 */
export const couponDetailPath = (code: string) => `/${encodeURIComponent(code)}`
