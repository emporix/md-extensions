/**
 * Host-owned routes with no equivalent inside this remote. Navigating to them
 * leaves the remote via `window.location.assign` (playbook decision
 * 2026-08-05). Orders is itself a federated remote, so its detail page is a
 * hash route.
 */
export const ORDERS_MODULE_PATH = '/apps/management/orders'

export const orderDetailUrl = (orderId: string): string =>
  `${ORDERS_MODULE_PATH}#/${orderId}`

/** MD route `/media-assets/:id` (root level, not under /apps/management). */
export const HOST_MEDIA_ASSET_PATH = (assetId: string) =>
  `/media-assets/${assetId}`

export const HOST_CATEGORY_PATH = (categoryId: string) =>
  `/apps/management/categories/${categoryId}`

export const HOST_PRICE_LIST_PATH = (priceListId: string) =>
  `/apps/management/price-lists/${priceListId}`

export const HOST_PRICE_MODEL_PATH = (priceModelId: string) =>
  `/apps/management/price-models/${priceModelId}`

export const HOST_PRODUCT_TEMPLATE_PATH = (templateId: string) =>
  `/apps/management/product-templates/${templateId}`

export const HOST_CART_PATH = (cartId: string) =>
  `/apps/management/carts/${cartId}`

export const HOST_CUSTOMER_PATH = (customerId: string) =>
  `/apps/management/customers/${customerId}`

export const HOST_COMPANY_PATH = (companyId: string) =>
  `/apps/management/companies/${companyId}`

export const HOST_SEGMENT_PATH = (segmentId: string) =>
  `/customer-management/segments/${segmentId}`

export const HOST_CUSTOM_INSTANCE_PATH = (type: string, instanceId: string) =>
  `/custom-instances/${type}/${instanceId}`

/** Leave the remote for a host-owned route (no in-remote equivalent). */
export const assignHostLocation = (path: string) => {
  window.location.assign(path)
}
