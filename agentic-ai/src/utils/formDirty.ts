export const toFormSnapshot = (value: unknown): string => JSON.stringify(value)

export const isFormDirty = (
  current: unknown,
  baseline: string | null
): boolean => baseline !== null && toFormSnapshot(current) !== baseline

export const nextBaselineAfterSilentUpdate = (
  baseline: string | null,
  previous: unknown,
  next: unknown
): string | null => {
  const previousSnapshot = toFormSnapshot(previous)
  if (baseline === null || baseline === previousSnapshot) {
    return toFormSnapshot(next)
  }

  return baseline
}
