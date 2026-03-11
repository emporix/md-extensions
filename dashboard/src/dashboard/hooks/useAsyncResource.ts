import { useCallback, useEffect, useRef, useState } from 'react'

export type UseAsyncResourceOptions<TValue> = {
  enabled: boolean
  initialValue: TValue
  loadValue: () => Promise<TValue>
  errorMessage: string
  deps?: ReadonlyArray<unknown>
}

export type UseAsyncResourceResult<TValue> = {
  value: TValue
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useAsyncResource = <TValue>({
  enabled,
  initialValue,
  loadValue,
  errorMessage,
  deps = [],
}: UseAsyncResourceOptions<TValue>): UseAsyncResourceResult<TValue> => {
  const initialValueRef = useRef(initialValue)
  const loadValueRef = useRef(loadValue)
  const latestRequestIdRef = useRef(0)
  const isMountedRef = useRef(true)
  const [value, setValue] = useState<TValue>(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const depsKey = JSON.stringify(deps)

  useEffect(() => {
    initialValueRef.current = initialValue
  }, [initialValue])

  useEffect(() => {
    loadValueRef.current = loadValue
  }, [loadValue])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      latestRequestIdRef.current += 1
    }
  }, [])

  const load = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current

    if (!enabled) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current)
        return
      setValue(initialValueRef.current)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const nextValue = await loadValueRef.current()
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current)
        return
      setValue(nextValue)
    } catch (e) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current)
        return
      setValue(initialValueRef.current)
      setError(e instanceof Error ? e.message : errorMessage)
    }
    if (isMountedRef.current && requestId === latestRequestIdRef.current) {
      setLoading(false)
    }
  }, [enabled, errorMessage])

  useEffect(() => {
    load()
  }, [load, depsKey])

  return {
    value,
    loading,
    error,
    refetch: load,
  }
}
