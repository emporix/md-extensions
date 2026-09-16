import { useEffect, useState } from 'react'

type UseCancellableLoadParams<T> = {
  readonly enabled: boolean
  readonly load: () => Promise<T>
  readonly fallbackError: string
}

export const useCancellableLoad = <T>({
  enabled,
  load,
  fallbackError,
}: UseCancellableLoadParams<T>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await load()
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : fallbackError)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [enabled, load, fallbackError])

  return { data, loading, error }
}
