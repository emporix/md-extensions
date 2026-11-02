import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAppState } from './AppStateContext'
import { getMyIamScopes, type IamScope } from '../services/iamScopesService'

type IamScopesContextValue = {
  readonly scopes: IamScope[]
  readonly loading: boolean
  readonly failed: boolean
  readonly reload: () => Promise<void>
}

const IamScopesContext = createContext<IamScopesContextValue | undefined>(
  undefined
)

type IamScopesProviderProps = {
  readonly children: ReactNode
}

const IamScopesProvider = ({ children }: IamScopesProviderProps) => {
  const appState = useAppState()
  const { tenant, token } = appState
  const appStateRef = useRef(appState)
  appStateRef.current = appState

  const [scopes, setScopes] = useState<IamScope[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!tenant) {
      setScopes([])
      setFailed(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setFailed(false)
    try {
      const next = await getMyIamScopes({
        ...appStateRef.current,
        tenant,
        token,
      })
      setScopes(next)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      console.error('Failed to load IAM scopes:', message)
      setScopes([])
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [tenant, token])

  useEffect(() => {
    void reload()
  }, [reload])

  const contextValue = useMemo(
    () => ({
      scopes,
      loading,
      failed,
      reload,
    }),
    [scopes, loading, failed, reload]
  )

  return (
    <IamScopesContext.Provider value={contextValue}>
      {children}
    </IamScopesContext.Provider>
  )
}

const useIamScopesState = (): IamScopesContextValue => {
  const context = useContext(IamScopesContext)
  if (!context) {
    throw new Error('useMyIamScopes must be used within an IamScopesProvider')
  }
  return context
}

export { IamScopesProvider, useIamScopesState }
