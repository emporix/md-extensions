import { useCallback } from 'react'
import { api } from '.'
import {
  AccessControl,
  Group,
  GroupUser,
  GroupUserTypes,
  Role,
  Template,
} from '../models/Groups'
import { User, UserScopes } from '../models/User'
import axiosRetry from 'axios-retry'
import { AxiosError, AxiosResponse } from 'axios'
import { useTenant } from '../context/TenantProvider'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQuery,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { PaginatedResponse } from './orders'
import { mapParamsToQ } from '../helpers/api'
import { deepClone } from '../helpers/utils'
import { DataTableFilterMetaData } from 'primereact/datatable'
import { fetchAllRecords } from '../helpers/paginationUtils'

// ROLES
export const fetchRoles = async (tenant: string): Promise<Role[]> => {
  const { data } = await api.get<Role[]>(`/iam/${tenant}/roles`, {
    params: {
      pageNumber: 1,
      pageSize: 60,
    },
    headers: {
      'x-total-count': true,
    },
  })
  return data
}

// PERMISSIONS
export const fetchPermissions = async (tenant: string): Promise<Role[]> => {
  const { data } = await api.get<Role[]>(`/iam/${tenant}/permissions`)
  return data
}

// GROUPS
export const fetchGroupsCall = async (
  tenant: string,
  userType: GroupUserTypes,
  pagination: Partial<PaginationProps> = {
    currentPage: 1,
    totalRecords: 1000,
  },
  params?: Record<string, string>
): Promise<PaginatedResponse<Group>> => {
  const requestParams: Record<string, unknown> = {
    pageNumber: pagination.currentPage,
    pageSize: pagination.rows,
    sort: formatPaginationParamsForSorting(pagination),
    userType,
  }
  if (pagination.filters) {
    const newFilters = deepClone(pagination.filters)
    if (newFilters.name) {
      requestParams.name =
        (pagination.filters.name as DataTableFilterMetaData).value || ''
      delete newFilters.name
    }
    requestParams.q = formatFilterQuery(newFilters)
  }
  if (params) {
    const extraQuery = mapParamsToQ(params)
    requestParams.q =
      `${extraQuery}` + (requestParams.q ? ` ${requestParams.q}` : '')
  }
  const { data, headers } = await api.get<Group[]>(`/iam/${tenant}/groups`, {
    params: requestParams,
    headers: {
      'x-total-count': true,
    },
  })
  return {
    values: data,
    totalRecords: +headers['x-total-count'],
  }
}

export const fetchGroup = async (
  tenant: string,
  groupId: string
): Promise<Group> => {
  const { data } = await api.get<Group>(`/iam/${tenant}/groups/${groupId}`)
  return data
}

export const delGroup = async (
  tenant: string,
  groupId: string,
  force = false
): Promise<Group[]> => {
  const { data } = await api.delete<Group[]>(
    `/iam/${tenant}/groups/${groupId}`,
    {
      params: {
        forceDelete: force,
      },
    }
  )
  return data
}

export const postGroupCall = async (
  tenant: string,
  group: Partial<Group>,
  userType = GroupUserTypes.EMPLOYEE
): Promise<Record<string, string>> => {
  const { data } = await api.post(`/iam/${tenant}/groups`, {
    ...group,
    userType,
  })
  return data.id
}

export const putGroupCall = async (
  tenant: string,
  group: Partial<Group>,
  groupId: string,
  userType = GroupUserTypes.EMPLOYEE
): Promise<void> => {
  await api.put<Group>(`/iam/${tenant}/groups/${groupId}`, {
    ...group,
    userType,
  })
}

// GROUP ASSIGNMENTS
export const fetchGroupUsers = async (
  tenant: string,
  groupId: string
): Promise<GroupUser[]> => {
  const usersRes = await api.get<GroupUser[]>(
    `/iam/${tenant}/groups/${groupId}/users`,
    {
      params: {
        pageSize: 9999,
      },
      headers: {
        'x-total-count': true,
      },
    }
  )
  return usersRes.data
}

export const postUserToGroup = async (
  tenant: string,
  groupId: string,
  userId: string,
  userType = GroupUserTypes.EMPLOYEE
): Promise<Group[]> => {
  const { data } = await api.post<Group[]>(
    `/iam/${tenant}/groups/${groupId}/users`,
    {
      userId,
      userType,
    }
  )
  return data
}

export const delUserFromGroup = async (
  tenant: string,
  groupId: string,
  userId: string
): Promise<Group[]> => {
  const { data } = await api.delete<Group[]>(
    `/iam/${tenant}/groups/${groupId}/users/${userId}`
  )
  return data
}

// RESOURCES
export const fetchResources = async (tenant: string): Promise<Group[]> => {
  const { data } = await api.get<Group[]>(`/iam/${tenant}/resources`, {
    headers: {
      'x-total-count': true,
    },
  })
  return data
}

// ACCESS-CONTROLS
export const getAccessControlsCall = async (tenant: string) => {
  const { data } = await api.get<AccessControl[]>(
    `/iam/${tenant}/access-controls`,
    {
      params: {
        expand: 'role,resource',
        pageSize: 9999,
      },
    }
  )
  return data
}

export const fetchAccessControlsTemplates = async (
  tenant: string
): Promise<Template[]> => {
  const { data } = await api.get<Template[]>(`/iam/${tenant}/templates`, {
    params: {
      expand: 'accessControls',
    },
  })
  return data
}

// USERS
export const getAccessControlsForUserCall = async (tenant: string) => {
  const { data } = await api.get<AccessControl[]>(
    `/iam/${tenant}/users/me/access-controls`,
    {
      params: {
        expand: 'role,resource',
        pageSize: 9999,
      },
    }
  )
  return data
}

export const fetchAllGroups4User = async (
  tenant: string,
  userId: string
): Promise<Group[]> => {
  const { data } = await api.get<Group[]>(
    `/iam/${tenant}/users/${userId}/groups`,
    {
      params: {
        pageSize: 9999,
      },
    }
  )
  return data
}

export const getScopesForUserCall = async (
  tenant: string,
  newAccessToken?: string
): Promise<UserScopes> => {
  let headers = {}
  if (newAccessToken) {
    headers = { Authorization: 'Bearer ' + newAccessToken }
  }
  const { data } = await api.get<UserScopes>(`/iam/${tenant}/users/me/scopes`, {
    headers,
  })
  return data
}

export const getUserCall = async (
  tenant: string,
  userId: string
): Promise<User> => {
  const { data } = await api.get<User>(`/iam/${tenant}/users/${userId}`)
  return data
}

export const deleteUserCall = async (
  tenant: string,
  userId: string
): Promise<AxiosResponse> => {
  return await api.delete<User>(`/iam/${tenant}/users/${userId}`)
}

export const createUserCall = async (
  tenant: string,
  user: Partial<User>
): Promise<string> => {
  const { data } = await api.post(`/iam/${tenant}/users`, {
    ...user,
  })
  return data.id
}

export const putUserCall = async (
  tenant: string,
  userId: string,
  payload: Partial<User>
): Promise<void> => {
  await api.put(`/iam/${tenant}/users/${userId}`, {
    ...payload,
  })
}

export const fetchUsers = async (
  tenant: string,
  userType: GroupUserTypes,
  pagination: {
    pageSize: number
    pageNumber: number
  }
): Promise<PaginatedResponse<User>> => {
  axiosRetry(api, { retries: 4 })
  const { data, headers } = await api.get(`/iam/${tenant}/users`, {
    headers: {
      'x-total-count': true,
    },
    params: {
      userType,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      // no filters cause API does not support it
    },
  })
  return { values: data, totalRecords: +headers['x-total-count'] }
}

const getUsersAssignedToVendorCall = async (
  tenant: string,
  vendorId: string
): Promise<PaginatedResponse<User>> => {
  const { data, headers } = await api.get(
    `/iam/${tenant}/users/vendors/${vendorId}`,
    {
      headers: {
        'x-total-count': true,
      },
    }
  )
  return { values: data, totalRecords: +headers['x-total-count'] }
}

// USEAPI EXPORTED METHODS
export const useIamApi = () => {
  const { tenant } = useTenant()

  const getUsersForTenant = useCallback(
    async (userType = GroupUserTypes.EMPLOYEE) => {
      if (tenant) {
        const fetchPage = async (pagination: Partial<PaginationProps>) => {
          return fetchUsers(tenant, userType, {
            pageNumber: pagination.currentPage || 1,
            pageSize: pagination.rows || 500,
          })
        }

        const users = await fetchAllRecords(fetchPage, {
          currentPage: 1,
          rows: 500,
        })

        return {
          values: users,
          totalRecords: users.length,
        }
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllGroups = useCallback(
    async (
      userType = GroupUserTypes.EMPLOYEE,
      params?: Record<string, string>
    ) => {
      if (tenant) {
        const fetchPage = async (pagination: Partial<PaginationProps>) => {
          return fetchGroupsCall(tenant, userType, pagination, params)
        }

        return fetchAllRecords(fetchPage, {
          currentPage: 1,
          rows: 100,
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getRoles = useCallback(() => {
    if (tenant) {
      return fetchRoles(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getPermissions = useCallback(() => {
    if (tenant) {
      return fetchPermissions(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const fetchGroups = useCallback(
    (
      paginationProps?: Partial<PaginationProps>,
      userType = GroupUserTypes.EMPLOYEE,
      params?: Record<string, string>
    ) => {
      if (tenant) {
        return fetchGroupsCall(tenant, userType, paginationProps, params)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const syncGroups = useCallback(
    async (
      paginationProps?: Partial<PaginationProps>,
      userType = GroupUserTypes.EMPLOYEE
    ) => {
      if (tenant) {
        const groups: Group[] = []
        let currentPage = 1
        const rows = 50

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const response = await fetchGroupsCall(tenant, userType, {
              ...paginationProps,
              currentPage,
              rows,
            })
            groups.push(...response.values)

            const totalCount = response.totalRecords
            if (groups.length >= totalCount) {
              break
            }

            currentPage++
          } catch (e) {
            if ((e as AxiosError).response?.status === 404) {
              break
            } else {
              throw e
            }
          }
        }

        return {
          values: groups,
          totalRecords: groups.length,
        }
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const fetchCustomerGroups = useCallback(
    (
      userType: GroupUserTypes = GroupUserTypes.CUSTOMER,
      paginationProps?: Partial<PaginationProps>
    ) => {
      if (tenant) {
        return fetchGroupsCall(tenant, userType, paginationProps)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getResources = useCallback(() => {
    if (tenant) {
      return fetchResources(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAccessControlsForTenant = useCallback(() => {
    if (tenant) {
      return getAccessControlsCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAccessControlsTemplates = useCallback(() => {
    if (tenant) {
      return fetchAccessControlsTemplates(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAccessControlsForUser = useCallback(() => {
    if (tenant) {
      return getAccessControlsForUserCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAllGroups4User = useCallback(
    (userId: string) => {
      if (tenant) {
        return fetchAllGroups4User(tenant, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getScopesForUser = useCallback(() => {
    if (tenant) {
      return getScopesForUserCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const addUserToGroup = useCallback(
    (groupId: string, userId: string, userType: GroupUserTypes) => {
      if (tenant) {
        return postUserToGroup(tenant, groupId, userId, userType)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteUserFromGroup = useCallback(
    (groupId: string, userId: string) => {
      if (tenant) {
        return delUserFromGroup(tenant, groupId, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createGroup = useCallback(
    (group: any, groupUserType: GroupUserTypes) => {
      if (tenant) {
        return postGroupCall(tenant, group, groupUserType)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getGroupById = useCallback(
    (groupId: string) => {
      if (tenant) {
        return fetchGroup(tenant, groupId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteGroupById = useCallback(
    (groupId: string, force?: boolean) => {
      if (tenant) {
        return delGroup(tenant, groupId, force)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateGroup = useCallback(
    (group: Partial<Group>, groupId: string, groupUserType: GroupUserTypes) => {
      if (tenant) {
        return putGroupCall(tenant, group, groupId, groupUserType)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getGroupUsers = useCallback(
    (groupId: string) => {
      if (tenant) {
        return fetchGroupUsers(tenant, groupId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getUser = useCallback(
    (userId: string) => {
      if (tenant) {
        return getUserCall(tenant, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createUser = useCallback(
    (user: Partial<User>) => {
      if (tenant) {
        return createUserCall(tenant, user)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteUser = useCallback(
    (userId: string) => {
      if (tenant) {
        return deleteUserCall(tenant, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const editUser = useCallback(
    (userId: string, payload: Partial<User>) => {
      if (tenant) {
        return putUserCall(tenant, userId, payload)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getUsersAssignedToVendor = useCallback(
    (vendorId: string) => {
      if (tenant) {
        return getUsersAssignedToVendorCall(tenant, vendorId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return {
    getRoles,
    getPermissions,
    syncGroups,
    fetchGroups,
    getAllGroups,
    getResources,
    getAccessControlsForTenant,
    getAccessControlsTemplates,
    getAccessControlsForUser,
    getAllGroups4User,
    getScopesForUser,
    addUserToGroup,
    deleteUserFromGroup,
    createGroup,
    getGroupById,
    deleteGroupById,
    updateGroup,
    getGroupUsers,
    getUser,
    deleteUser,
    createUser,
    editUser,
    getUsersForTenant,
    fetchCustomerGroups,
    getUsersAssignedToVendor,
  }
}
