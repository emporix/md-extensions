import { useCallback, useEffect, useState } from 'react'
import { getOAuths } from '../services/oauthService'
import { OAuth } from '../types/OAuth'
import { useAppState } from '../contexts/AppStateContext'

export const useAgentOAuthCatalog = () => {
  const appState = useAppState()
  const [oauths, setOAuths] = useState<OAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!appState.tenant || !appState.token) {
      setOAuths([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fetchedOAuths = await getOAuths(appState)
      setOAuths(fetchedOAuths)
    } catch (catalogError) {
      setOAuths([])
      setError(
        catalogError instanceof Error
          ? catalogError.message
          : 'Failed to fetch OAuth configurations'
      )
    } finally {
      setLoading(false)
    }
  }, [appState])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return {
    oauths,
    loading,
    error,
  }
}
