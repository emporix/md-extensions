import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useDashboardContext } from './Dashboard.context'
import {
  useFeatureTogglesApi,
  type FeatureToggleValue,
} from '../hooks/api/featureToggles'

type FeatureTogglesContextValue = {
  readonly toggles: FeatureToggleValue[] | undefined
  readonly togglesLoading: boolean
  readonly isToggleValid: (code: string) => boolean
  readonly syncToggles: () => Promise<void>
}

const FeatureTogglesContext = createContext<FeatureTogglesContextValue>({
  toggles: undefined,
  togglesLoading: true,
  isToggleValid: () => false,
  syncToggles: async () => undefined,
})

export const useFeatureToggles = () => useContext(FeatureTogglesContext)

type FeatureTogglesProviderProps = {
  readonly children: ReactNode
}

const FeatureTogglesProvider = ({ children }: FeatureTogglesProviderProps) => {
  const { tenant } = useDashboardContext()
  const { getAllFeatureToggleValues } = useFeatureTogglesApi()
  const [toggles, setToggles] = useState<FeatureToggleValue[]>()
  const [togglesLoading, setTogglesLoading] = useState(true)

  const syncToggles = useCallback(async () => {
    if (!tenant) {
      setToggles(undefined)
      setTogglesLoading(false)
      return
    }

    setTogglesLoading(true)
    setToggles(undefined)
    try {
      const values = await getAllFeatureToggleValues()
      setToggles(values)
    } catch (error) {
      console.error('Error syncing feature toggles:', error)
    } finally {
      setTogglesLoading(false)
    }
  }, [getAllFeatureToggleValues, tenant])

  useEffect(() => {
    void syncToggles()
  }, [syncToggles])

  const isToggleValid = useCallback(
    (code: string): boolean => {
      const toggle = toggles?.find((entry) => entry.code === code)
      return toggle?.isEnabled ?? false
    },
    [toggles]
  )

  return (
    <FeatureTogglesContext.Provider
      value={{
        toggles,
        togglesLoading,
        syncToggles,
        isToggleValid,
      }}
    >
      {children}
    </FeatureTogglesContext.Provider>
  )
}

export default FeatureTogglesProvider
