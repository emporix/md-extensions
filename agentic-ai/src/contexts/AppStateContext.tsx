import { createContext, useContext } from 'react'
import { AppState } from '../types/common'

type AppStateContextType = AppState

const Context = createContext<AppStateContextType | undefined>(undefined)

const useAppState = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

export { useAppState }

const AppStateProvider = ({
  children,
  appState,
}: {
  children: React.ReactNode
  appState: AppState
}) => {
  return <Context.Provider value={appState}>{children}</Context.Provider>
}

export { AppStateProvider }
