import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState } from '../types/common'
import { getCommerceEvents } from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'

export interface CommerceEventsState {
  events: string[]
  loading: boolean
  error: string | null
}

type CommerceEventsCacheEntry = {
  events: string[]
  error: string | null
}

const commerceEventsCache = new Map<string, CommerceEventsCacheEntry>()

const getCommerceEventsCacheKey = (appState: AppState): string | null => {
  if (!appState.tenant) {
    return null
  }
  return appState.tenant
}

export const useCommerceEvents = (appState: AppState) => {
  const { t } = useTranslation()
  const cacheKey = getCommerceEventsCacheKey(appState)
  const cached = cacheKey ? commerceEventsCache.get(cacheKey) : undefined

  const [state, setState] = useState<CommerceEventsState>(() => ({
    events: cached?.events ?? [],
    loading: !cached,
    error: cached?.error ?? null,
  }))

  const fetchEvents = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!appState.tenant || !appState.token) {
        return
      }

      const hasCachedData = Boolean(
        cacheKey && commerceEventsCache.has(cacheKey)
      )
      const silent = options?.silent ?? hasCachedData

      if (!silent) {
        setState((prev) => ({ ...prev, loading: true, error: null }))
      }

      try {
        const response = await getCommerceEvents(appState)
        const sortedEvents = (response.events || []).sort((a, b) =>
          a.localeCompare(b)
        )
        const nextEntry: CommerceEventsCacheEntry = {
          events: sortedEvents,
          error: null,
        }

        if (cacheKey) {
          commerceEventsCache.set(cacheKey, nextEntry)
        }

        setState({
          events: sortedEvents,
          loading: false,
          error: null,
        })
      } catch (error) {
        const errorMessage = formatApiError(
          error,
          t('error_loading_commerce_events')
        )
        const nextEntry: CommerceEventsCacheEntry = {
          events: [],
          error: errorMessage,
        }

        if (cacheKey) {
          commerceEventsCache.set(cacheKey, nextEntry)
        }

        setState({
          events: [],
          error: errorMessage,
          loading: false,
        })
      }
    },
    [appState, cacheKey, t]
  )

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

  return {
    ...state,
    refetch: fetchEvents,
  }
}
