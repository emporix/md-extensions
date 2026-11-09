/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = () => MODULE_ROOT

export const unitAddPath = () => '/add'

export const unitDetailPath = (code: string) => `/${encodeURIComponent(code)}`
