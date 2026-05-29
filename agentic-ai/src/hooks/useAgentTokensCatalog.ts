import { useCallback, useEffect, useState } from 'react'
import { getTokens } from '../services/tokensService'
import { Token } from '../types/Token'
import { AppState } from '../types/common'

const agentTokensCatalogCache = new Map<string, Token[]>()
const agentTokensCatalogRequests = new Map<string, Promise<Token[]>>()

const getAgentTokensCatalogCacheKey = (appState: AppState): string | null => {
  if (!appState.tenant) {
    return null
  }
  return appState.tenant
}

export const useAgentTokensCatalog = (appState: AppState) => {
  const cacheKey = getAgentTokensCatalogCacheKey(appState)
  const cached = cacheKey ? agentTokensCatalogCache.get(cacheKey) : undefined

  const [tokens, setTokens] = useState<Token[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!appState.tenant || !appState.token || !cacheKey) {
      setTokens([])
      setLoading(false)
      setError(null)
      return
    }

    const cachedEntry = agentTokensCatalogCache.get(cacheKey)
    if (cachedEntry) {
      setTokens(cachedEntry)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let request = agentTokensCatalogRequests.get(cacheKey)
      if (!request) {
        request = getTokens(appState)
          .then((fetchedTokens) => {
            agentTokensCatalogCache.set(cacheKey, fetchedTokens)
            return fetchedTokens
          })
          .finally(() => {
            agentTokensCatalogRequests.delete(cacheKey)
          })
        agentTokensCatalogRequests.set(cacheKey, request)
      }

      const fetchedTokens = await request
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
  }, [appState, cacheKey])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return {
    tokens,
    loading,
    error,
  }
}
