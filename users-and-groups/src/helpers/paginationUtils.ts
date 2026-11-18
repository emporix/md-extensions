import { isAxiosError } from 'axios'
import { PaginationProps } from '../hooks/usePagination'
import { type PaginatedResponse } from '@emporix/api-calls'

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
  let firstPageLength: number | undefined
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
      firstPageLength ??= response.values.length

      // Call progress callback if provided
      if (onProgress) {
        onProgress(allRecords.length, totalRecords)
      }

      // Check if we've fetched all records
      if (response.values.length === 0 || allRecords.length >= totalRecords) {
        break
      }

      // X-Total-Count can be higher than the number of records the API
      // returns (IAM users: 35 counted, 34 listed), and the API answers 404
      // for a page that starts past the count. Stop once the pages fetched
      // so far cover it. The page size is the one the API actually used (the
      // length of the first page), never the requested `rows`: an API that
      // caps the page size would otherwise get its list cut short.
      const currentPage = currentPagination.currentPage || 1
      if (currentPage * firstPageLength >= totalRecords) {
        break
      }

      // Move to next page
      currentPagination = {
        ...currentPagination,
        currentPage: currentPage + 1,
      }

      // Reset retry count on successful request
      retryCount = 0
    } catch (error) {
      // A 404 past the first page means "no such page", not a failure: keep
      // the records fetched so far (same guard as in Management Dashboard).
      const currentPage = currentPagination.currentPage ?? 1
      if (
        currentPage > 1 &&
        allRecords.length > 0 &&
        isAxiosError(error) &&
        error.response?.status === 404
      ) {
        break
      }

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
