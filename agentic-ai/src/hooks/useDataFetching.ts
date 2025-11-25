import { useState, useCallback } from 'react'
import { formatApiError } from '../utils/errorHelpers'

export interface DataFetchingState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

export interface DeleteConfirmState {
  deleteConfirmVisible: boolean
  itemToDelete: string | null
}

export interface UseDataFetchingResult<T> {
  // Data state
  data: T[]
  setData: React.Dispatch<React.SetStateAction<T[]>>
  loading: boolean
  error: string | null

  // Delete confirmation state
  deleteConfirmVisible: boolean
  itemToDelete: string | null
  showDeleteConfirm: (itemId: string) => void
  hideDeleteConfirm: () => void

  // Actions
  fetchData: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDataFetching = <T>(
  fetchFunction: () => Promise<T[]>,
  fallbackErrorMessage: string
): UseDataFetchingResult<T> => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedData = await fetchFunction()
      setData(fetchedData)
    } catch (err) {
      const message = formatApiError(err, fallbackErrorMessage)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [fallbackErrorMessage, fetchFunction])

  const showDeleteConfirm = useCallback((itemId: string) => {
    setItemToDelete(itemId)
    setDeleteConfirmVisible(true)
  }, [])

  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirmVisible(false)
    setItemToDelete(null)
  }, [])

  return {
    data,
    setData,
    loading,
    error,
    deleteConfirmVisible,
    itemToDelete,
    showDeleteConfirm,
    hideDeleteConfirm,
    fetchData,
    setLoading,
    setError,
  }
}
