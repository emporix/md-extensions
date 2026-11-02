import { describe, expect, it, vi } from 'vitest'
import { abandonListLoad } from './listLoad.helpers'

describe('abandonListLoad', () => {
  it('invalidates the in-flight request and resets list state', () => {
    const loadRequestIdRef = { current: 4 }
    const clearRows = vi.fn()
    const setLoading = vi.fn()
    const setError = vi.fn()
    const resetCursor = vi.fn()

    abandonListLoad({
      loadRequestIdRef,
      clearRows,
      setLoading,
      setError,
      resetCursor,
    })

    expect(loadRequestIdRef.current).toBe(5)
    expect(clearRows).toHaveBeenCalledOnce()
    expect(setError).toHaveBeenCalledWith(null)
    expect(setLoading).toHaveBeenCalledWith(true)
    expect(resetCursor).toHaveBeenCalledOnce()
  })
})
