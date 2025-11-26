import { useCallback } from 'react'
import { formatApiError } from '../utils/errorHelpers'

export interface UseUpsertItemOptions<T> {
  onUpsert: (item: T) => Promise<T>
  updateItems: (updater: (prevItems: T[]) => T[]) => void
  setError?: (error: string | null) => void
  getId: (item: T) => string
}

export const useUpsertItem = <T>({
  onUpsert,
  updateItems,
  setError,
  getId,
}: UseUpsertItemOptions<T>) => {
  return useCallback(
    async (item: T): Promise<T> => {
      try {
        const savedItem = await onUpsert(item)

        updateItems((prevItems) => {
          const existingIndex = prevItems.findIndex(
            (existing) => getId(existing) === getId(item)
          )
          if (existingIndex >= 0) {
            // Update existing item
            return prevItems.map((existingItem) =>
              getId(existingItem) === getId(savedItem)
                ? savedItem
                : existingItem
            )
          } else {
            return [...prevItems, savedItem]
          }
        })

        return savedItem
      } catch (err) {
        const message = formatApiError(err, `Failed to save ${typeof item}`)
        if (setError) {
          setError(message)
        }
        throw err
      }
    },
    [onUpsert, updateItems, setError, getId]
  )
}
