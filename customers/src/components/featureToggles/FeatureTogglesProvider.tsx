import { createContext, FC, ReactNode, useContext, useMemo } from 'react'

interface FeatureTogglesContextType {
  featureToggles: Record<string, boolean>
  validateFeature: (_key: string) => void
}

const FeatureTogglesContext = createContext<FeatureTogglesContextType>({
  featureToggles: {},
  validateFeature: () => {},
})

export const useFeatureToggles = () => useContext(FeatureTogglesContext)

/**
 * Management Dashboard resolves toggles from configuration; the extension treats optional features as enabled unless disabled via env.
 */
export const FeatureTogglesProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const value = useMemo(
    () => ({
      featureToggles: {
        DCP_ASSISTED_BUYING:
          import.meta.env.VITE_DISABLE_ASSISTED_BUYING !== 'true',
      },
      validateFeature: () => {},
    }),
    []
  )

  return (
    <FeatureTogglesContext.Provider value={value}>
      {children}
    </FeatureTogglesContext.Provider>
  )
}
