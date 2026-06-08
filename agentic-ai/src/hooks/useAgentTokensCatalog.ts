import { useCallback, useEffect, useState } from 'react'
import { getTokens } from '../services/tokensService'
import { Token } from '../types/Token'
import { useAppState } from '../contexts/AppStateContext'

export const useAgentTokensCatalog = () => {
  const appState = useAppState()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!appState.tenant || !appState.token) {
      setTokens([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fetchedTokens = await getTokens(appState)
      setTokens(fetchedTokens)
    } catch (catalogError) {
      setTokens([])
      setError(
        catalogError instanceof Error
          ? catalogError.message
          : 'Failed to fetch tokens'
      )
    } finally {
      setLoading(false)
    }
  }, [appState])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return {
    tokens,
    loading,
    error,
  }
}
