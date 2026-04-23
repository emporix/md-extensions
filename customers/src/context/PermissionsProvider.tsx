import React, { createContext, useContext, FC } from 'react'
import { Props } from '../helpers/props'
import { useDashboardContext } from './Dashboard.context'
import {
  ResourcesDCP,
  ResourcesOE,
  RoleCode,
} from '../helpers/accessConfig'
import { Template } from '../models/Groups'

export type Permissions = {
  [key in ResourcesDCP | ResourcesOE]?: { [key in RoleCode]?: boolean }
}

interface PermissionContextType {
  permissions: Permissions | undefined
  userPermissions: Set<string>
  tenantPermissions: Set<string>
  userAccessControls: string[]
  tenantAccessControls: string[]
  templates: Template[]
  /** OAuth-style scopes; empty => RestrictionsProvider treats lists as unrestricted */
  userScopes: string[]
  isPermissionsLoading: boolean
  vendor?: string
  syncUserAccessControls: () => Promise<void>
}

const PermissionsContext = createContext<PermissionContextType>({
  permissions: undefined,
  userPermissions: new Set([]),
  tenantPermissions: new Set([]),
  userAccessControls: [],
  tenantAccessControls: [],
  templates: [],
  userScopes: [],
  isPermissionsLoading: false,
  vendor: undefined,
  syncUserAccessControls: async () => {},
})

export const usePermissions = () => useContext(PermissionsContext)

/**
 * Permissions are supplied by the Management Dashboard host via appState.
 */
export const PermissionsProvider: FC<Props> = ({ children }) => {
  const { permissions } = useDashboardContext()

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        userPermissions: new Set(),
        tenantPermissions: new Set(),
        userAccessControls: [],
        tenantAccessControls: [],
        templates: [],
        userScopes: [],
        isPermissionsLoading: false,
        vendor: undefined,
        syncUserAccessControls: async () => {},
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}
