import { useCallback } from 'react'
import { formatApiError } from '../utils/errorHelpers'

export interface UseUpsertItemOptions<
  TSaved extends { id: string },
  TInput extends { id: string } = TSaved,
> {
  onUpsert: (item: TInput) => Promise<TSaved>
  updateItems: (updater: (prevItems: TSaved[]) => TSaved[]) => void
  setError?: (error: string | null) => void
  getId: (item: TSaved | TInput) => string
}

export const useUpsertItem = <
  TSaved extends { id: string },
  TInput extends { id: string } = TSaved,
>({
  onUpsert,
  updateItems,
  setError,
  getId,
}: UseUpsertItemOptions<TSaved, TInput>) => {
  return useCallback(
    async (item: TInput): Promise<TSaved> => {
      try {
        const savedItem = await onUpsert(item)

        updateItems((prevItems) => {
          const existingIndex = prevItems.findIndex(
            (existing) => getId(existing) === getId(item)
          )
          if (existingIndex >= 0) {
            return prevItems.map((existingItem) =>
              getId(existingItem) === getId(savedItem)
                ? savedItem
                : existingItem
            )
          }
          return [...prevItems, savedItem]
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
