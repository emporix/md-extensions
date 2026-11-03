import { useEffect, useRef } from 'react'

export const depsChanged = (
  previous: readonly unknown[],
  next: readonly unknown[]
): boolean =>
  previous.length !== next.length ||
  previous.some((value, index) => !Object.is(value, next[index]))

/**
 * useEffect that skips the initial mount and only fires when a dependency
 * actually changed. Compares against the previous dependency values instead
 * of a "first run" flag, so React StrictMode's double effect invocation in
 * dev does not count as an update.
 */
const useUpdateEffect = (
  effect: () => void,
  dependencies: readonly unknown[]
) => {
  const previousDeps = useRef<readonly unknown[]>(dependencies)

  useEffect(() => {
    if (!depsChanged(previousDeps.current, dependencies)) {
      return
    }
    previousDeps.current = dependencies
    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}

export default useUpdateEffect
