import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import { getConversations } from '../services/conversationsService'
import { Conversation } from '../types/Conversation'

interface UseConversationsScope {
  toolId?: string
  agentId?: string
  enabled?: boolean
}

export const useConversations = ({
  toolId,
  agentId,
  enabled = true,
}: UseConversationsScope) => {
  const appState = useAppState()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('lastMessageAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  const scopeKey = useMemo(
    () =>
      JSON.stringify({
        toolId: toolId?.trim() ?? '',
        agentId: agentId?.trim() ?? '',
        enabled,
      }),
    [toolId, agentId, enabled]
  )

  const fetchConversations = useCallback(
    async (
      newPageSize?: number,
      newPageNumber?: number,
      newFilters?: Record<string, string>,
      newSortBy?: string,
      newSortOrder?: 'ASC' | 'DESC'
    ) => {
      if (!enabled) {
        setConversations([])
        setTotalRecords(0)
        setError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const currentPageSize = newPageSize ?? pageSize
        const currentPageNumber = newPageNumber ?? pageNumber
        const currentFilters = newFilters ?? filters
        const currentSortBy = newSortBy ?? sortBy
        const currentSortOrder = newSortOrder ?? sortOrder

        const result = await getConversations(appState, {
          toolId: toolId?.trim() || undefined,
          agentId: agentId?.trim() || undefined,
          pageNumber: currentPageNumber,
          pageSize: currentPageSize,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
          filters: currentFilters,
        })

        setConversations(result.conversations)
        setTotalRecords(result.totalCount ?? result.conversations.length)
      } catch (err) {
        setConversations([])
        setTotalRecords(0)
        setError(
          err instanceof Error ? err.message : 'Failed to fetch conversations'
        )
      } finally {
        setLoading(false)
      }
    },
    [
      agentId,
      appState,
      enabled,
      filters,
      pageNumber,
      pageSize,
      sortBy,
      sortOrder,
      toolId,
    ]
  )

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPageNumber(1)
  }, [])

  const changePage = useCallback((newPageNumber: number) => {
    setPageNumber(newPageNumber)
  }, [])

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
  }, [])

  const sortConversations = useCallback(
    (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
    },
    []
  )

  const filtersString = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    if (!enabled) {
      setConversations([])
      setTotalRecords(0)
      setError(null)
      setLoading(false)
      return
    }

    fetchConversations()
  }, [
    enabled,
    scopeKey,
    pageSize,
    pageNumber,
    filtersString,
    sortBy,
    sortOrder,
    fetchConversations,
  ])

  return {
    conversations,
    loading,
    error,
    pageSize,
    pageNumber,
    totalRecords,
    updateFilters,
    changePage,
    changePageSize,
    sortConversations,
  }
}
