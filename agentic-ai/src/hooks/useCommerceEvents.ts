import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../contexts/AppStateContext'
import { getCommerceEvents } from '../services/agentService'
import { formatApiError } from '../utils/errorHelpers'

export interface CommerceEventsState {
  events: string[]
  loading: boolean
  error: string | null
}

export const useCommerceEvents = () => {
  const appState = useAppState()
  const { t } = useTranslation()

  const [state, setState] = useState<CommerceEventsState>({
    events: [],
    loading: true,
    error: null,
  })

  const fetchEvents = useCallback(async () => {
    if (!appState.tenant || !appState.token) {
      setState({
        events: [],
        loading: false,
        error: null,
      })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await getCommerceEvents(appState)
      const sortedEvents = (response.events || []).sort((a, b) =>
        a.localeCompare(b)
      )

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

      setState({
        events: [],
        error: errorMessage,
        loading: false,
      })
    }
  }, [appState, t])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

  return {
    ...state,
    refetch: fetchEvents,
  }
}
