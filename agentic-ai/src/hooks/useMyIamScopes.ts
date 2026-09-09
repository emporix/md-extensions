import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../contexts/AppStateContext'
import { getMyIamScopes, IamScope } from '../services/iamScopesService'

export const useMyIamScopes = (
  enabled = true,
  errorKey = 'event_scopes_load_error'
) => {
  const appState = useAppState()
  const { t } = useTranslation()
  const [scopes, setScopes] = useState<IamScope[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getMyIamScopes(appState)
      setScopes(result)
    } catch {
      setScopes([])
      setError(t(errorKey))
    } finally {
      setLoading(false)
    }
  }, [appState, enabled, errorKey, t])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    scopes,
    loading,
    error,
    reload,
  }
}
