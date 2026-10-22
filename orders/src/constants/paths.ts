/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const ordersListPath = () => MODULE_ROOT

export const orderDetailPath = (orderId: string) => `/${orderId}`

/**
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * has to leave the remote via `window.location.assign` — see
 * playbook decision 2026-08-05 (Brands media tiles).
 */
export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

export const HOST_QUOTE_PATH = (quoteId: string) =>
  `/apps/management/quotes/${quoteId}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`
