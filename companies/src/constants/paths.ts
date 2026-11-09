/**
 * Hash-relative paths inside the federated remote (HashRouter). They mirror
 * MD's `/apps/management/companies/...` pathnames under the module root.
 * Ids are URL-encoded so ids with `#`, `/` or `?` stay one path segment.
 */
export const MODULE_ROOT = '/'

const segment = (id: string) => encodeURIComponent(id)

const withQuery = (path: string, query?: string | URLSearchParams) => {
  const search = query?.toString().replace(/^\?/, '') ?? ''
  return search ? `${path}?${search}` : path
}

export const companiesListPath = () => MODULE_ROOT

export const companyAddPath = (query?: string | URLSearchParams) =>
  withQuery('/add', query)

export const companyDetailPath = (
  companyId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(companyId)}`, query)

export const locationAddPath = (
  companyId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(companyId)}/locations`, query)

export const locationEditPath = (
  companyId: string,
  locationId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(companyId)}/locations/${segment(locationId)}`, query)

export const contactAddPath = (
  companyId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(companyId)}/assignments/contact`, query)

export const contactEditPath = (
  companyId: string,
  contactAssignmentId: string,
  query?: string | URLSearchParams
) =>
  withQuery(
    `/${segment(companyId)}/assignments/contact/${segment(contactAssignmentId)}`,
    query
  )

export const customerAssignmentAddPath = (
  companyId: string,
  query?: string | URLSearchParams
) => withQuery(`/${segment(companyId)}/assignments/customer`, query)

export const customerAssignmentEditPath = (
  companyId: string,
  contactAssignmentId: string,
  query?: string | URLSearchParams
) =>
  withQuery(
    `/${segment(companyId)}/assignments/customer/${segment(contactAssignmentId)}`,
    query
  )

/**
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * has to leave the remote via `window.location.assign` — see playbook
 * decision 2026-08-05 (Brands media tiles).
 */
export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

/** Customer groups is a federated remote with a HashRouter. */
export const HOST_CUSTOMER_GROUP_PATH = (groupId: string) =>
  `/administration/customer-groups#/groups/${groupId}`

export const HOST_QUOTE_PATH = (quoteId: string) =>
  `/apps/management/quotes/${quoteId}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
