/** Reads a dot-delimited path off an object, returning undefined on any gap. */
export const getValueFromPath = (obj: unknown, path: string): unknown => {
  if (!path || typeof path !== 'string') {
    return undefined
  }

  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj
    )
}
