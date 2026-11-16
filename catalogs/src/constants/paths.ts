/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = () => MODULE_ROOT

export const catalogAddPath = () => '/add'

/** Ids are encoded so `/`, `?`, `#` or `%` in an id stay inside one segment. */
export const catalogDetailPath = (id: string) => `/${encodeURIComponent(id)}`
