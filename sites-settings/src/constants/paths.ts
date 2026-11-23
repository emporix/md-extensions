/**
 * Hash-relative paths inside the federated remote (HashRouter). They mirror
 * MD's `/apps/management/sites-settings/...` pathnames under the module root.
 * Site codes are URL-encoded so a code with `#`, `/` or `?` stays one segment.
 */
export const MODULE_ROOT = '/'

export const sitesListPath = () => MODULE_ROOT

export const siteAddPath = () => '/add'

export const siteDetailPath = (siteCode: string) =>
  `/${encodeURIComponent(siteCode)}`

/**
 * Host-owned routes with no equivalent inside this remote (mixin reference
 * fields). Navigating to them leaves the remote via `window.location.assign`
 * — playbook decision 2026-08-05.
 */

/** Customers is a federated remote with a HashRouter. */
export const customerDetailPath = (customerId: string) =>
  `/apps/management/customers#/${encodeURIComponent(customerId)}`

/** Companies is a federated remote with a HashRouter. */
export const HOST_COMPANY_PATH = (companyId: string) =>
  `/apps/management/companies#/${encodeURIComponent(companyId)}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
