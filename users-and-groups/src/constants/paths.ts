/** Hash-relative paths inside the federated remote (HashRouter). */
export const MODULE_ROOT = '/'

export const listPath = (tab?: 'users' | 'groups') =>
  tab ? `/?tab=${tab}` : MODULE_ROOT

export const userAddPath = () => '/users/add'

export const userDetailPath = (userId: string) => `/users/${userId}`

export const groupAddPath = () => '/groups/add'

export const groupDetailPath = (groupId: string) => `/groups/${groupId}`
