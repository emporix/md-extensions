/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const returnsListPath = () => MODULE_ROOT

export const returnAddPath = () => '/add'

export const returnDetailPath = (returnId: string) => `/${returnId}`

/**
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * has to leave the remote via `window.location.assign` — see
 * playbook decision 2026-08-05 (Brands media tiles).
 */
export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

// Orders is itself a federated remote (COP-6917): its detail route lives in
// the hash, so a plain `/apps/management/orders/:id` would land on the list.
export const HOST_ORDER_PATH = (orderId: string) =>
  `/apps/management/orders#/${orderId}`
