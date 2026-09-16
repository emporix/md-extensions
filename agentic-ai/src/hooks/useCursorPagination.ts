import { useCallback, useState } from 'react'
import type { CursorParams } from '../types/CursorPagination'

export const useCursorPagination = () => {
  const [cursor, setCursor] = useState<CursorParams | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [prevCursor, setPrevCursor] = useState<string | null>(null)

  const setCursors = useCallback((next: string | null, prev: string | null) => {
    setNextCursor(next)
    setPrevCursor(prev)
  }, [])

  const resetCursor = useCallback(() => {
    setCursor(null)
    setNextCursor(null)
    setPrevCursor(null)
  }, [])

  const goNext = useCallback(() => {
    if (!nextCursor) return
    setCursor({ next: nextCursor })
  }, [nextCursor])

  const goPrevious = useCallback(() => {
    if (!prevCursor) return
    setCursor({ prev: prevCursor })
  }, [prevCursor])

  const cursorKey = cursor?.next
    ? `next:${cursor.next}`
    : cursor?.prev
      ? `prev:${cursor.prev}`
      : ''

  return {
    cursor,
    nextCursor,
    prevCursor,
    setCursors,
    resetCursor,
    goNext,
    goPrevious,
    cursorKey,
  }
}
