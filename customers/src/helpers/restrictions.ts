/**
 * Restriction parsing from MD's `RestrictionsProvider`. Returns `null` when
 * the user has an unrestricted scope, otherwise the allowed restriction (site)
 * codes encoded as `order.order_read--SITE_A#SITE_B`.
 */
export const parseRestrictions = (
  scopes: string[],
  userScopes: string[]
): string[] | null => {
  const hasUnrestricted = scopes.some((scope) => userScopes.includes(scope))
  if (hasUnrestricted) {
    return null
  }
  for (const scope of scopes) {
    const restrictedScope = userScopes.find((userScope) =>
      userScope.startsWith(scope + '--')
    )
    if (restrictedScope) {
      return restrictedScope.split('--')[1].split('#')
    }
  }
  return null
}
