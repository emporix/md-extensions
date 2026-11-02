export const PROTECTED_GROUP_CODES = ['CUSTOMER'] as const

export function isNonDeletableGroupCode(
  code: string | null | undefined,
  protectedCodes: readonly string[]
): boolean {
  const normalized = code?.trim().toLowerCase()
  if (!normalized) {
    return false
  }
  return protectedCodes.some(
    (protectedCode) => protectedCode.toLowerCase() === normalized
  )
}

export function selectionIncludesNonDeletableGroup(
  groups: ReadonlyArray<{ code?: string | null }>,
  protectedCodes: readonly string[]
): boolean {
  return groups.some((group) =>
    isNonDeletableGroupCode(group.code, protectedCodes)
  )
}
