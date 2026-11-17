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
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * has to leave the remote via `window.location.assign` — see playbook
 * decision 2026-08-05 (Brands media tiles).
 */
export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
