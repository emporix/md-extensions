import { createContext, useContext, type PropsWithChildren } from 'react'
import { AppState } from '../models/AppState.model'

type DashboardContextType = AppState

const defaultAppState: AppState = {
  tenant: '',
  language: 'en',
  token: '',
  currency: undefined,
  contentLanguage: 'en',
  user: undefined,
  onError: () => {
    // NOOP
  },
}

const Context = createContext<DashboardContextType>(defaultAppState)

export const useDashboardContext = () => useContext(Context)

export type DashboardProviderProps = PropsWithChildren<{
  appState: AppState
}>

export const DashboardProvider = ({
  children,
  appState,
}: DashboardProviderProps) => {
  return <Context.Provider value={appState}>{children}</Context.Provider>
}
