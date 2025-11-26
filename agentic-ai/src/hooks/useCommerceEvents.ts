import { useState, useEffect, useCallback } from 'react'
import { AppState } from '../types/common'
import { getCommerceEvents } from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'

export interface CommerceEventsState {
  events: string[]
  loading: boolean
  error: string | null
}

export const useCommerceEvents = (appState: AppState) => {
  const [state, setState] = useState<CommerceEventsState>({
    events: [],
    loading: false,
    error: null,
  })

  const fetchEvents = useCallback(async () => {
    if (!appState.tenant || !appState.token) {
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await getCommerceEvents(appState)
      const sortedEvents = (response.events || []).sort((a, b) =>
        a.localeCompare(b)
      )
      setState((prev) => ({
        ...prev,
        events: sortedEvents,
        loading: false,
      }))
    } catch (error) {
      const errorMessage = formatApiError(
        error,
        'Failed to fetch commerce events'
      )
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
        events: [],
      }))
    }
  }, [appState])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    ...state,
    refetch: fetchEvents,
  }
}
