/**
 * Host-owned routes used by mixin references, with no equivalent inside this
 * remote. Navigating to them leaves the remote via `window.location.assign`
 * (playbook decision 2026-08-05). Products is itself a federated remote, so
 * its detail page is a hash route. Category references stay inside this
 * remote (`constants/paths`).
 */
export const ORDERS_MODULE_PATH = '/apps/management/orders'

/** Orders is a federated remote with a HashRouter. */
export const orderDetailUrl = (orderId: string): string =>
  `${ORDERS_MODULE_PATH}#/${encodeURIComponent(orderId)}`

export const PRODUCTS_MODULE_PATH = '/apps/management/products'

export const productDetailUrl = (productId: string): string =>
  `${PRODUCTS_MODULE_PATH}#/${productId}`

/** MD route `/media-assets/:id` (root level, not under /apps/management). */
export const HOST_MEDIA_ASSET_PATH = (assetId: string) =>
  `/media-assets/${assetId}`

/** Companies is a federated remote with a HashRouter. */
export const companyDetailUrl = (companyId: string): string =>
  `/apps/management/companies#/${encodeURIComponent(companyId)}`

export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`

export const HOST_PRICE_LIST_PATH = (priceListId: string) =>
  `/apps/management/price-lists/${priceListId}`

export const HOST_SEGMENT_PATH = (segmentId: string) =>
  `/customer-management/segments/${segmentId}`

export const HOST_CUSTOM_INSTANCE_PATH = (type: string, instanceId: string) =>
  `/custom-instances/${type}/${instanceId}`

/** Leave the remote for a host-owned route (no in-remote equivalent). */
export const assignHostLocation = (path: string) => {
  window.location.assign(path)
}
