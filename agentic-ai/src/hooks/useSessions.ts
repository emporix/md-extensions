import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { SessionLogs } from '../types/Log'
import { useCursorPagination } from './useCursorPagination'

export const useSessions = () => {
  const { t } = useTranslation()
  const appState = useAppState()
  const location = useLocation()
  const [sessions, setSessions] = useState<SessionLogs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>('metadata.modifiedAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const loadRequestIdRef = useRef(0)

  const {
    cursor,
    nextCursor,
    prevCursor,
    setCursors,
    resetCursor,
    goNext,
    goPrevious,
    cursorKey,
  } = useCursorPagination()

  const logService = useMemo(() => new LogService(appState), [appState])

  const fetchSessions = useCallback(
    async (
      agentId: string,
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      newFilters?: Record<string, string>
    ) => {
      const requestId = ++loadRequestIdRef.current
      const requestCursor = cursor
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentFilters = newFilters !== undefined ? newFilters : filters

        const response = await logService.getSessions(
          agentId || undefined,
          currentPageSize,
          currentFilters,
          currentSortBy,
          currentSortOrder,
          requestCursor
        )

        if (requestId !== loadRequestIdRef.current) return
        if (requestCursor && response.data.length === 0) {
          resetCursor()
          return
        }
        setSessions(response.data)
        setCursors(response.nextCursor, response.prevCursor)
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(
          err instanceof Error ? err.message : t('failed_to_fetch_sessions')
        )
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [pageSize, filters, logService, cursor, resetCursor, setCursors, t]
  )

  const refreshSessions = useCallback(
    (agentId: string) => {
      return fetchSessions(agentId || '', sortBy, sortOrder, undefined, filters)
    },
    [fetchSessions, filters, sortBy, sortOrder]
  )

  const sortSessions = useCallback(
    (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
      resetCursor()
    },
    [resetCursor]
  )

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      if (JSON.stringify(filters) === JSON.stringify(newFilters)) {
        return
      }
      setFilters(newFilters)
      resetCursor()
    },
    [filters, resetCursor]
  )

  const changePageSize = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize)
      resetCursor()
    },
    [resetCursor]
  )

  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  const fetchSessionsRef = useRef(fetchSessions)
  fetchSessionsRef.current = fetchSessions

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    const parsedFilters = JSON.parse(filtersString) as Record<string, string>
    fetchSessionsRef.current(
      agentIdParam || '',
      sortBy,
      sortOrder,
      pageSize,
      parsedFilters
    )
  }, [
    pageSize,
    cursorKey,
    appState.tenant,
    appState.token,
    location.search,
    filtersString,
    sortBy,
    sortOrder,
  ])

  return {
    sessions,
    loading,
    error,
    pageSize,
    nextCursor,
    prevCursor,
    filters,
    refreshSessions,
    sortSessions,
    changePageSize,
    updateFilters,
    goNext,
    goPrevious,
  }
}
