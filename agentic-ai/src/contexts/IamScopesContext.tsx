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
import {
  getMyIamScopes,
  readMyIamScopes,
  type IamScope,
} from '../services/iamScopesService'
import {
  applyScopeLoadResult,
  beginScopeLoad,
  finishScopeLoad,
  initialScopeLoadState,
  scopeIdentityKey,
  visibleScopeLoad,
  type ScopeLoadState,
} from '../utils/scopeLoad'

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

  const [loadState, setLoadState] = useState<ScopeLoadState<IamScope>>(() =>
    initialScopeLoadState(
      tenant,
      token,
      tenant ? readMyIamScopes(appState) : undefined
    )
  )

  const reload = useCallback(async () => {
    if (!tenant) {
      setLoadState(initialScopeLoadState('', '', undefined))
      return
    }

    const requestKey = scopeIdentityKey(tenant, token)
    const currentKey = () =>
      scopeIdentityKey(appStateRef.current.tenant, appStateRef.current.token)
    const cached = readMyIamScopes({
      ...appStateRef.current,
      tenant,
      token,
    })
    if (cached) {
      setLoadState((state) =>
        applyScopeLoadResult(state, requestKey, currentKey(), {
          ok: true,
          scopes: cached,
        })
      )
      return
    }

    setLoadState(beginScopeLoad(requestKey))
    try {
      const next = await getMyIamScopes({
        ...appStateRef.current,
        tenant,
        token,
      })
      setLoadState((state) =>
        applyScopeLoadResult(state, requestKey, currentKey(), {
          ok: true,
          scopes: next,
        })
      )
    } catch (error) {
      if (requestKey === currentKey()) {
        const message = error instanceof Error ? error.message : 'unknown error'
        console.error('Failed to load IAM scopes:', message)
      }
      setLoadState((state) =>
        applyScopeLoadResult(state, requestKey, currentKey(), { ok: false })
      )
    } finally {
      setLoadState((state) => finishScopeLoad(state, requestKey, currentKey()))
    }
  }, [tenant, token])

  useEffect(() => {
    void reload()
  }, [reload])

  const visible = visibleScopeLoad(loadState, tenant, token)
  const contextValue = useMemo(
    () => ({
      scopes: visible.scopes,
      loading: visible.loading,
      failed: visible.failed,
      reload,
    }),
    [visible.scopes, visible.loading, visible.failed, reload]
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
