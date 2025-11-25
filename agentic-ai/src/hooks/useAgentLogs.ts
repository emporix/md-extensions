import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router'
import { LogSummary, RequestLogs } from '../types/Log'
import { AppState } from '../types/common'
import { LogService } from '../services/logService'

export const useAgentLogs = (appState: AppState) => {
  const location = useLocation()
  const [logs, setLogs] = useState<LogSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<RequestLogs | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const logService = useMemo(() => new LogService(appState), [appState])

  const fetchLogs = useCallback(
    async (
      sortBy?: string,
      sortOrder?: 'ASC' | 'DESC',
      newPageSize?: number,
      newPageNumber?: number,
      agentId?: string,
      newFilters?: Record<string, string>
    ) => {
      try {
        setLoading(true)
        setError(null)
        const currentPageSize = newPageSize || pageSize
        const currentPageNumber = newPageNumber || pageNumber
        const currentFilters = newFilters !== undefined ? newFilters : filters
        const response = await logService.getAgentLogs(
          sortBy,
          sortOrder,
          currentPageSize,
          currentPageNumber,
          agentId,
          currentFilters
        )
        setLogs(response.data)
        setTotalRecords(response.totalCount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, pageNumber, filters, logService]
  )

  const fetchLogDetails = useCallback(
    async (logId: string) => {
      try {
        setDetailsLoading(true)
        setDetailsError(null)
        const logDetails = await logService.getAgentLogDetails(logId)
        setSelectedLog(logDetails)
      } catch (err) {
        setDetailsError(
          err instanceof Error ? err.message : 'Failed to fetch log details'
        )
      } finally {
        setDetailsLoading(false)
      }
    },
    [logService]
  )

  const fetchLogsByAgent = useCallback(
    async (agentId: string) => {
      try {
        setLoading(true)
        setError(null)
        const response = await logService.getAgentLogsByAgentId(agentId)
        setLogs(response.data)
        setTotalRecords(response.totalCount)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch logs for agent'
        )
      } finally {
        setLoading(false)
      }
    },
    [logService]
  )

  const clearSelectedLog = useCallback(() => {
    setSelectedLog(null)
    setDetailsError(null)
  }, [])

  const refreshLogs = useCallback(
    (agentId?: string) => {
      return fetchLogs(
        'metadata.createdAt',
        'DESC',
        undefined,
        undefined,
        agentId,
        filters
      )
    },
    [fetchLogs, filters]
  )

  const sortLogs = useCallback(
    (sortBy: string, sortOrder: 'ASC' | 'DESC', agentId?: string) => {
      return fetchLogs(
        sortBy,
        sortOrder,
        undefined,
        undefined,
        agentId,
        filters
      )
    },
    [fetchLogs, filters]
  )

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPageNumber(1) // Reset to first page when filters change
  }, [])

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber)
    // The fetchLogs will be called by useEffect when pageNumber changes
  }, [])

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
    // The fetchLogs will be called by useEffect when pageSize changes
  }, [])

  // Create stable reference for filters to prevent unnecessary re-renders
  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  // Fetch logs when dependencies change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const agentIdParam = urlParams.get('agentId')
    fetchLogs(
      'metadata.createdAt',
      'DESC',
      pageSize,
      pageNumber,
      agentIdParam || undefined,
      filters
    )
  }, [pageSize, pageNumber, location.search, filtersString, fetchLogs, filters])

  return {
    logs,
    loading,
    error,
    selectedLog,
    detailsLoading,
    detailsError,
    pageSize,
    pageNumber,
    totalRecords,
    filters,
    fetchLogDetails,
    fetchLogsByAgent,
    clearSelectedLog,
    refreshLogs,
    sortLogs,
    changePage,
    changePageSize,
    updateFilters,
  }
}
