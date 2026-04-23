import React, { createContext, useContext } from 'react'
import { Props } from '../helpers/props'
import { useDashboardContext } from './Dashboard.context'

interface ContextData {
  tenants: string[]
  tenant: string
  switchTenant: (newTenant: string) => unknown
}

const Context = createContext<ContextData>({
  tenants: [],
  tenant: '',
  switchTenant: () => {
    // NOOP — tenant is controlled by Management Dashboard host
  },
})

export const useTenant = () => useContext(Context)

/**
 * Federated extension: tenant comes from host appState, not auth storage.
 */
export const TenantProvider = ({ children }: Props) => {
  const { tenant } = useDashboardContext()
  return (
    <Context.Provider
      value={{
        tenant,
        tenants: tenant ? [tenant] : [],
        switchTenant: () => {},
      }}
    >
      {children}
    </Context.Provider>
  )
}
