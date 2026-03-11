/**
 * In-flight request deduplication cache.
 *
 * Entries live only while the associated promise is pending — once it settles
 * (resolve or reject) the key is automatically removed. This means the cache
 * never grows unboundedly and is safe for long-lived sessions.
 *
 * `clearCache()` is provided for testing or for explicit invalidation (e.g.
 * on logout) so that stale in-flight references do not leak across contexts.
 */
const inFlight = new Map<string, Promise<unknown>>()

/**
 * Deduplicates in-flight requests by key. When multiple callers request the same key
 * concurrently, only one loader runs; all callers receive the same promise.
 * The key is removed when the promise settles so future requests run again.
 */
export const getOrLoad = <T>(
  key: string,
  loader: () => Promise<T>
): Promise<T> => {
  const existing = inFlight.get(key)
  if (existing) {
    return existing as Promise<T>
  }
  const promise = loader().finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

/** Clears all in-flight entries. Useful on logout or in tests. */
export const clearCache = (): void => {
  inFlight.clear()
}
