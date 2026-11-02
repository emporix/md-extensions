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
  getFeatureToggleValues,
  toAgenticToggles,
  type AgenticFeatureToggles,
  type FeatureToggleValue,
} from '../services/featureToggleService'

type FeatureTogglesContextValue = {
  readonly toggles: AgenticFeatureToggles
  readonly loading: boolean
  readonly isToggleValid: (code: string) => boolean
  readonly syncToggles: () => Promise<void>
}

const FeatureTogglesContext = createContext<
  FeatureTogglesContextValue | undefined
>(undefined)

type FeatureTogglesProviderProps = {
  readonly children: ReactNode
}

const FeatureTogglesProvider = ({ children }: FeatureTogglesProviderProps) => {
  const appState = useAppState()
  const { tenant, token } = appState
  const appStateRef = useRef(appState)
  appStateRef.current = appState

  const [values, setValues] = useState<FeatureToggleValue[] | undefined>()
  const [loading, setLoading] = useState(true)

  const syncToggles = useCallback(async () => {
    if (!tenant) {
      setValues(undefined)
      setLoading(false)
      return
    }

    setLoading(true)
    setValues(undefined)
    try {
      const next = await getFeatureToggleValues({
        ...appStateRef.current,
        tenant,
        token,
      })
      setValues(next)
    } catch (error) {
      console.error('Error syncing feature toggles:', error)
      setValues([])
    } finally {
      setLoading(false)
    }
  }, [tenant, token])

  useEffect(() => {
    void syncToggles()
  }, [syncToggles])

  const isToggleValid = useCallback(
    (code: string): boolean => {
      const toggle = values?.find((entry) => entry.code === code)
      return toggle?.isEnabled ?? false
    },
    [values]
  )

  const toggles = useMemo(() => toAgenticToggles(values ?? []), [values])

  const contextValue = useMemo(
    () => ({
      toggles,
      loading,
      isToggleValid,
      syncToggles,
    }),
    [toggles, loading, isToggleValid, syncToggles]
  )

  return (
    <FeatureTogglesContext.Provider value={contextValue}>
      {children}
    </FeatureTogglesContext.Provider>
  )
}

const useFeatureToggles = (): FeatureTogglesContextValue => {
  const context = useContext(FeatureTogglesContext)
  if (!context) {
    throw new Error(
      'useFeatureToggles must be used within a FeatureTogglesProvider'
    )
  }
  return context
}

export { FeatureTogglesProvider, useFeatureToggles }
