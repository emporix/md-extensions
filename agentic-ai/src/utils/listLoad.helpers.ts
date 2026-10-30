type AbandonListLoadArgs = {
  readonly loadRequestIdRef: { current: number }
  readonly clearRows: () => void
  readonly setLoading: (loading: boolean) => void
  readonly setError: (error: string | null) => void
  readonly resetCursor: () => void
}

export const abandonListLoad = ({
  loadRequestIdRef,
  clearRows,
  setLoading,
  setError,
  resetCursor,
}: AbandonListLoadArgs): void => {
  loadRequestIdRef.current += 1
  clearRows()
  setError(null)
  setLoading(true)
  resetCursor()
}
