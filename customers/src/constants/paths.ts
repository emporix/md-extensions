/**
 * Hash-relative paths inside the federated remote (HashRouter). They mirror
 * MD's `/apps/management/customers/...` pathnames under the module root.
 * Ids are URL-encoded so ids with `#`, `/` or `?` stay one path segment.
 */
export const MODULE_ROOT = '/'

const segment = (id: string) => encodeURIComponent(id)

const withQuery = (path: string, query?: string | URLSearchParams) => {
  const search = query?.toString().replace(/^\?/, '') ?? ''
  return search ? `${path}?${search}` : path
}

export const customersListPath = () => MODULE_ROOT

export const customerAddPath = (query?: string | URLSearchParams) =>
  withQuery('/add', query)

export const customerDetailPath = (
  customerId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(customerId)}`, query)

/**
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * has to leave the remote via `window.location.assign` — see playbook
 * decision 2026-08-05 (Brands media tiles).
 */

/** Customer groups is a federated remote with a HashRouter. */
export const HOST_CUSTOMER_GROUP_PATH = (groupId: string) =>
  `/administration/customer-groups#/groups/${encodeURIComponent(groupId)}`

/**
 * Companies is a federated remote with a HashRouter. `customerId` lets the
 * company page's Back button return to this customer (as in MD).
 */
export const HOST_COMPANY_PATH = (companyId: string, customerId?: string) =>
  `/apps/management/companies#/${encodeURIComponent(companyId)}${
    customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''
  }`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
