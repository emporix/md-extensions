/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const productsListPath = () => MODULE_ROOT

export const productDetailPath = (productId: string) => `/${productId}`

export const productCreatePath = (search = '') =>
  `/add${search ? `?${search.replace(/^\?/, '')}` : ''}`
