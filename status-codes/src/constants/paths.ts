/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = () => MODULE_ROOT

export const statusCodeAddPath = () => '/add'

export const statusCodeDetailPath = (statusCodeId: string) => `/${statusCodeId}`
