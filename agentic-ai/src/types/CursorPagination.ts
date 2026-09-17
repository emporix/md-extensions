export type CursorParams = {
  next?: string
  prev?: string
}

export type CursorPageResult<T> = {
  data: T[]
  nextCursor: string | null
  prevCursor: string | null
}
