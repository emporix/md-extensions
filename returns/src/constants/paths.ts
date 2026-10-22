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

// Keep the host pathname form during rollout: md-extensions merges (and
// redeploys returns) before the MD host switches Orders to the remote. The
// host PR redirects `/orders/:id` → `/orders#/:id` once Mode A is live.
export const HOST_ORDER_PATH = (orderId: string) =>
  `/apps/management/orders/${orderId}`
