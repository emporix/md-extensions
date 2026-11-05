/**
 * MD `helpers/utils` `compareObjects` / `deepMerge`, kept local to the mixins
 * package until they are promoted to the remote's `helpers/utils`.
 */

export const compareObjects = <T extends object>(
  obj1: T,
  obj2: T
): Partial<T> => {
  const changedFields: Partial<T> = {}
  for (const [key, obj1Value] of Object.entries(obj1)) {
    const obj2Value = obj2[key as keyof T]
    if (obj2Value !== obj1Value) {
      if (typeof obj2Value === 'object' && typeof obj1Value === 'object') {
        const nestedChanges = compareObjects(
          obj1Value as object,
          obj2Value as object
        )
        if (Object.keys(nestedChanges).length > 0) {
          ;(changedFields as Record<string, unknown>)[key] = nestedChanges
        }
      } else {
        changedFields[key as keyof T] = obj2Value
      }
    }
  }
  return changedFields
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- MD signature (untyped mixin payloads)
export const deepMerge = <T = any>(a: T, b: T): T => {
  if (b === undefined) return a
  if (a === null || b === null) return b as T
  // handle two arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    return b as T
  }
  // handle when base is an object and target is an array
  if (Array.isArray(a) !== Array.isArray(b)) {
    return b as T
  }
  // handle two objects
  if (typeof a === 'object' && typeof b === 'object') {
    const base = a as Record<string, unknown>
    const target = b as Record<string, unknown>
    const result: Record<string, unknown> = { ...base }
    for (const key of Object.keys(target)) {
      result[key] =
        key in base ? deepMerge(base[key], target[key]) : target[key]
    }
    return result as T
  }
  return b as T
}
