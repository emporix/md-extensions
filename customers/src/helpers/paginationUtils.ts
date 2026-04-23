import { PaginationProps } from '../hooks/usePagination'
import { PaginatedResponse } from '../api/orders'

export const fetchAllRecords = async <T>(
  fetchFunction: (
    pagination: Partial<PaginationProps>
  ) => Promise<PaginatedResponse<T>>,
  initialPagination: Partial<PaginationProps> = {
    currentPage: 1,
    rows: 100, // Default to larger page size for efficiency
  },
  options: {
    maxRetries?: number
    retryDelay?: number
    onProgress?: (currentCount: number, totalCount: number) => void
  } = {}
): Promise<T[]> => {
  const { maxRetries = 3, retryDelay = 1000, onProgress } = options
  const allRecords: T[] = []
  let currentPagination = { ...initialPagination }
  let totalRecords = 0
  let retryCount = 0

  while (allRecords.length < totalRecords || totalRecords === 0) {
    try {
      const response = await fetchFunction(currentPagination)

      // Set total records from first response
      if (totalRecords === 0) {
        totalRecords = response.totalRecords
      }

      // Add new records to our collection
      allRecords.push(...response.values)

      // Call progress callback if provided
      if (onProgress) {
        onProgress(allRecords.length, totalRecords)
      }

      // Check if we've fetched all records
      if (response.values.length === 0 || allRecords.length >= totalRecords) {
        break
      }

      // Move to next page
      currentPagination = {
        ...currentPagination,
        currentPage: (currentPagination.currentPage || 1) + 1,
      }

      // Reset retry count on successful request
      retryCount = 0
    } catch (error) {
      retryCount++

      if (retryCount >= maxRetries) {
        console.error(
          `Failed to fetch records after ${maxRetries} retries:`,
          error
        )
        throw error
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * retryCount)
      )
    }
  }

  return allRecords
}
