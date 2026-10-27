import { useCallback } from 'react'
import {
  deleteAccessControlCall,
  deleteGroupCall,
  deleteScopeCall,
  deleteUserCall,
  deleteUserFromGroupCall,
  getAccessControlCall,
  getAccessControlsCall,
  getAccessControlsForUserCall,
  getAccessControlsTemplatesCall,
  getAllGroupsForUserCall,
  getGroupCall,
  getGroupUsersCall,
  getGroupsCall,
  getScopeCall,
  getScopesCall,
  getScopesForUserCall,
  getUserCall,
  getUsersAssignedToVendorCall,
  getUsersCall,
  postGroupCall,
  postUserCall,
  postUserToGroupCall,
  putAccessControlCall,
  putGroupCall,
  putScopeCall,
  putUserCall,
} from '@emporix/api-calls'
import { Group, GroupUser, GroupUserTypes } from '../../models/Groups.model'
import { User } from '../../models/User.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { PaginatedResponse, PaginationProps } from '../../hooks/usePagination'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import { AccessControl, Scope } from '../../models/Permissions.model'

export const useIamApi = () => {
  const { tenant } = useDashboardContext()

  const getScopes = useCallback(
    (paginationProps: Partial<PaginationProps>) => {
      if (tenant) {
        return getScopesCall(tenant, toApiPagination(paginationProps))
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllScopes = useCallback(async () => {
    if (tenant) {
      const fetchPage = async (pagination: Partial<PaginationProps>) => {
        return getScopesCall(tenant, toApiPagination(pagination))
      }
      const scopes = await fetchAllRecords(
        fetchPage,
        apiPagination({ currentPage: 1, rows: 1000 })
      )
      return {
        values: scopes,
        totalRecords: scopes.length,
      }
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getScopesForUser = useCallback(() => {
    if (tenant) {
      return getScopesForUserCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getScope = useCallback(
    (scopeId: string) => {
      if (tenant) {
        return getScopeCall(tenant, scopeId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateScope = useCallback(
    (scope: Partial<Scope>) => {
      if (tenant) {
        return putScopeCall(tenant, scope)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteScope = useCallback(
    (scopeId: string) => {
      if (tenant) {
        return deleteScopeCall(tenant, scopeId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAccessControls = useCallback(
    (paginationProps: Partial<PaginationProps>) => {
      if (tenant) {
        return getAccessControlsCall(tenant, toApiPagination(paginationProps))
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllAccessControls = useCallback(async () => {
    if (tenant) {
      const fetchPage = async (pagination: Partial<PaginationProps>) => {
        return getAccessControlsCall(tenant, toApiPagination(pagination))
      }
      const accessControls = await fetchAllRecords(
        fetchPage,
        apiPagination({ currentPage: 1, rows: 1000 })
      )
      return {
        values: accessControls,
        totalRecords: accessControls.length,
      }
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAllAccessControlsForUser = useCallback(() => {
    if (tenant) {
      return getAccessControlsForUserCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAccessControlsTemplates = useCallback(() => {
    if (tenant) {
      return getAccessControlsTemplatesCall(tenant)
    } else {
      return Promise.reject('no tenant')
    }
  }, [tenant])

  const getAccessControl = useCallback(
    (id: string) => {
      if (tenant) {
        return getAccessControlCall(tenant, id)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateAccessControl = useCallback(
    (accessControl: Partial<AccessControl>) => {
      if (tenant) {
        return putAccessControlCall(tenant, accessControl)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteAccessControl = useCallback(
    (id: string) => {
      if (tenant) {
        return deleteAccessControlCall(tenant, id)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getGroups = useCallback(
    (
      paginationProps?: Partial<PaginationProps>,
      userType = GroupUserTypes.EMPLOYEE,
      params?: Record<string, string>
    ) => {
      if (tenant) {
        return getGroupsCall(
          tenant,
          userType,
          paginationProps ? toApiPagination(paginationProps) : undefined,
          params
        )
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
          return getGroupsCall(
            tenant,
            userType,
            toApiPagination(pagination),
            params
          )
        }
        const groups = await fetchAllRecords(
          fetchPage,
          apiPagination({ currentPage: 1, rows: 100 })
        )
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

  const getAllGroupsForUser = useCallback(
    (userId: string) => {
      if (tenant) {
        return getAllGroupsForUserCall(tenant, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createGroup = useCallback(
    (group: Partial<Group>, groupUserType: GroupUserTypes) => {
      if (tenant) {
        return postGroupCall(tenant, group, groupUserType)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getGroup = useCallback(
    (groupId: string) => {
      if (tenant) {
        return getGroupCall(tenant, groupId)
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

  const deleteGroup = useCallback(
    (groupId: string, force?: boolean) => {
      if (tenant) {
        return deleteGroupCall(tenant, groupId, force)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const addUserToGroup = useCallback(
    (groupId: string, userId: string, userType: GroupUserTypes) => {
      if (tenant) {
        return postUserToGroupCall(tenant, groupId, userId, userType)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getGroupUsers = useCallback(
    (groupId: string): Promise<GroupUser[]> => {
      if (tenant) {
        return getGroupUsersCall(tenant, groupId) as Promise<GroupUser[]>
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteUserFromGroup = useCallback(
    (groupId: string, userId: string) => {
      if (tenant) {
        return deleteUserFromGroupCall(tenant, groupId, userId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllUsers = useCallback(
    async (userType = GroupUserTypes.EMPLOYEE) => {
      if (tenant) {
        const fetchPage = async (pagination: Partial<PaginationProps>) => {
          const page = pagination as Partial<PaginationProps> & {
            rows?: number
          }
          return getUsersCall(tenant, userType, {
            pageNumber: page.currentPage || 1,
            pageSize: page.rows || 500,
          })
        }
        const users = await fetchAllRecords(
          fetchPage,
          apiPagination({ currentPage: 1, rows: 500 })
        )
        return {
          values: users as User[],
          totalRecords: users.length,
        }
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getUsersAssignedToVendor = useCallback(
    (vendorId: string): Promise<PaginatedResponse<User>> => {
      if (tenant) {
        return getUsersAssignedToVendorCall(tenant, vendorId) as Promise<
          PaginatedResponse<User>
        >
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createUser = useCallback(
    (user: Partial<User>) => {
      if (tenant) {
        return postUserCall(tenant, user as Parameters<typeof postUserCall>[1])
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getUser = useCallback(
    (userId: string): Promise<User> => {
      if (tenant) {
        return getUserCall(tenant, userId) as Promise<User>
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateUser = useCallback(
    (userId: string, payload: Partial<User>) => {
      if (tenant) {
        return putUserCall(
          tenant,
          userId,
          payload as Parameters<typeof putUserCall>[2]
        )
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

  // IAM Return object

  const scopes = {
    getScopes,
    getAllScopes,
    getScopesForUser,
    getScope,
    updateScope,
    deleteScope,
  }

  const accessControls = {
    getAccessControls,
    getAllAccessControls,
    getAllAccessControlsForUser,
    getAccessControlsTemplates,
    getAccessControl,
    updateAccessControl,
    deleteAccessControl,
  }

  const groups = {
    getGroups,
    getAllGroups,
    getAllGroupsForUser,
    getGroup,
    createGroup,
    deleteGroup,
    updateGroup,
    getGroupUsers,
    addUserToGroup,
    deleteUserFromGroup,
  }

  const users = {
    getAllUsers,
    getUsersAssignedToVendor,
    getUser,
    createUser,
    deleteUser,
    updateUser,
  }

  return {
    ...accessControls,
    ...scopes,
    ...groups,
    ...users,
  }
}
