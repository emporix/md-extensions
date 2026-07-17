import { useEffect, useState } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import {
  AgenticFeatureToggles,
  getAgenticFeatureToggles,
} from '../services/featureToggleService'

const DEFAULT_TOGGLES: AgenticFeatureToggles = {
  msTeams: false,
  aiOauth: false,
}

export const useFeatureToggles = () => {
  const appState = useAppState()
  const [toggles, setToggles] = useState<AgenticFeatureToggles>(DEFAULT_TOGGLES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const resolved = await getAgenticFeatureToggles(appState)
        if (!cancelled) {
          setToggles(resolved)
        }
      } catch {
        if (!cancelled) {
          setToggles(DEFAULT_TOGGLES)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [appState.tenant, appState.token])

  return { toggles, loading }
}
