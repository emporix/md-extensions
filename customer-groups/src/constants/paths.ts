/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = () => MODULE_ROOT

export const groupAddPath = () => '/groups/add'

export const groupDetailPath = (groupId: string) => `/groups/${groupId}`
