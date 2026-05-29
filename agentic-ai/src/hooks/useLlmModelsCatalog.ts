import { useCallback, useEffect, useState } from 'react'
import { fetchLlmModels } from '../services/modelsService'
import { AppState } from '../types/common'
import {
  isEmptyModelsCatalog,
  ModelsByProviderMap,
  toModelsByProvider,
} from '../utils/llmModelHelpers'

type LlmModelsCatalogCacheEntry = ModelsByProviderMap

const llmModelsCatalogCache = new Map<string, LlmModelsCatalogCacheEntry>()
const llmModelsCatalogRequests = new Map<
  string,
  Promise<LlmModelsCatalogCacheEntry>
>()

type UseLlmModelsCatalogOptions = {
  enabled?: boolean
}

export const useLlmModelsCatalog = (
  appState: AppState,
  options: UseLlmModelsCatalogOptions = {}
) => {
  const { enabled = true } = options
  const tenant = appState.tenant?.trim() ?? ''
  const token = appState.token?.trim() ?? ''
  const cacheKey = tenant || null

  const getValidCachedEntry = (): LlmModelsCatalogCacheEntry | undefined => {
    if (!cacheKey) {
      return undefined
    }

    const cachedEntry = llmModelsCatalogCache.get(cacheKey)
    if (!cachedEntry || isEmptyModelsCatalog(cachedEntry)) {
      return undefined
    }

    return cachedEntry
  }

  const cached = getValidCachedEntry()

  const [modelsByProvider, setModelsByProvider] = useState<ModelsByProviderMap>(
    cached ?? new Map()
  )
  const [loading, setLoading] = useState(enabled && !cached)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(Boolean(cached))

  const fetchCatalog = useCallback(async () => {
    if (!enabled) {
      return
    }

    if (!tenant || !token || !cacheKey) {
      setModelsByProvider(new Map())
      setLoading(true)
      setError(null)
      setHasFetched(false)
      return
    }

    const cachedEntry = llmModelsCatalogCache.get(cacheKey)
    if (cachedEntry && !isEmptyModelsCatalog(cachedEntry)) {
      setModelsByProvider(cachedEntry)
      setLoading(false)
      setError(null)
      setHasFetched(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let request = llmModelsCatalogRequests.get(cacheKey)
      if (!request) {
        request = fetchLlmModels(appState)
          .then((responses) => {
            const entry = toModelsByProvider(responses)
            if (!isEmptyModelsCatalog(entry)) {
              llmModelsCatalogCache.set(cacheKey, entry)
            }
            return entry
          })
          .finally(() => {
            llmModelsCatalogRequests.delete(cacheKey)
          })
        llmModelsCatalogRequests.set(cacheKey, request)
      }

      const entry = await request
      setModelsByProvider(entry)
      setHasFetched(true)
    } catch (catalogError) {
      setModelsByProvider(new Map())
      setError(
        catalogError instanceof Error
          ? catalogError.message
          : 'Failed to fetch models'
      )
      setHasFetched(true)
    } finally {
      setLoading(false)
    }
  }, [appState, cacheKey, enabled, tenant, token])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  return {
    modelsByProvider,
    loading,
    error,
    hasFetched,
  }
}
