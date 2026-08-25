import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../contexts/AppStateContext'
import { getIamScopes, IamScope } from '../services/iamScopesService'

export const useIamScopes = (enabled = true) => {
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
      const result = await getIamScopes(appState)
      setScopes(result)
    } catch {
      setScopes([])
      setError(t('mcp_tool_scopes_load_error'))
    } finally {
      setLoading(false)
    }
  }, [appState, enabled, t])

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
