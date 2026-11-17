/**
 * Hash-relative paths inside the federated remote (HashRouter). They mirror
 * MD's `/apps/management/quotes/...` pathnames under the module root.
 * Ids are URL-encoded so ids with `#`, `/` or `?` stay one path segment.
 */
export const MODULE_ROOT = '/'

const segment = (id: string) => encodeURIComponent(id)

export const quotesListPath = (): string => MODULE_ROOT

export const quoteAddPath = (): string => '/add'

export const quoteDetailPath = (quoteId: string): string =>
  `/${segment(quoteId)}`

/**
 * Routes with no equivalent inside this remote. Navigating to them has to
 * leave the remote via `window.location.assign` — see playbook decision
 * 2026-08-05 (Brands media tiles). Customers is a federated remote with a
 * HashRouter, so its URL is MD's `customerDetailUrl` (COP-7185).
 */
export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers#/${encodeURIComponent(customerId)}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
