import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router'
import { useAppState } from '../contexts/AppStateContext'
import { LogService } from '../services/logService'
import { SessionLogs } from '../types/Log'

export const useSessions = () => {
  const appState = useAppState()
  const location = useLocation()
  const [sessions, setSessions] = useState<SessionLogs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>('metadata.modifiedAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  const logService = useMemo(() => new LogService(appState), [appState])

  const fetchSessions = useCallback(
    async (
      agentId: string,
      currentSortBy: string,
      currentSortOrder: 'ASC' | 'DESC',
      newPageSize?: number,
      newPageNumber?: number,
      newFilters?: Record<string, string>
    ) => {
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentPageNumber = newPageNumber || pageNumber
        const currentFilters = newFilters !== undefined ? newFilters : filters

        const response = await logService.getSessions(
          agentId || undefined,
          currentPageSize,
          currentPageNumber,
          currentFilters,
          currentSortBy,
          currentSortOrder
        )

        setSessions(response.data)
        setTotalRecords(response.totalCount)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch sessions'
        )
      } finally {
        setLoading(false)
      }
    },
    [pageSize, pageNumber, filters, logService]
  )

  const refreshSessions = useCallback(
    (agentId: string) => {
      return fetchSessions(
        agentId || '',
        sortBy,
        sortOrder,
        undefined,
        undefined,
        filters
      )
    },
    [fetchSessions, filters, sortBy, sortOrder]
  )

  const sortSessions = useCallback(
    (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
    },
    []
  )

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPageNumber(1) // Reset to first page when filters change
  }, [])

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber)
  }, [])

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
  }, [])

  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    fetchSessions(
      agentIdParam || '',
      sortBy,
      sortOrder,
      pageSize,
      pageNumber,
      filters
    )
  }, [
    pageSize,
    pageNumber,
    appState.tenant,
    appState.token,
    location.search,
    filtersString,
    filters,
    fetchSessions,
    sortBy,
    sortOrder,
  ])

  return {
    sessions,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    filters,
    refreshSessions,
    sortSessions,
    changePage,
    changePageSize,
    updateFilters,
  }
}
