/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = () => MODULE_ROOT

export const taxClassAddPath = () => '/add'

export const taxClassEditPath = (countryCode: string, taxClassCode: string) =>
  `/${encodeURIComponent(countryCode)}/${encodeURIComponent(taxClassCode)}`
