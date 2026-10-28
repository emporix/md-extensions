const RETURNS_SITE_SCOPES = ['returns.returns_read', 'returns.returns_manage']

export const returnsSiteRestrictions = (
  userScopes: string[]
): string[] | null => {
  const hasUnrestricted = RETURNS_SITE_SCOPES.some((scope) =>
    userScopes.some((userScope) => userScope === scope)
  )

  if (hasUnrestricted) {
    return null
  }

  for (const scope of RETURNS_SITE_SCOPES) {
    const restrictedScope = userScopes.find((userScope) =>
      userScope.startsWith(scope + '--')
    )
    if (restrictedScope) {
      const restrictionsString = restrictedScope.split('--')[1]
      return restrictionsString.split('#')
    }
  }

  return null
}

export const isReturnsSiteRestricted = (
  siteCode: string | undefined,
  userScopes: string[]
): boolean => {
  if (!siteCode || siteCode.trim() === '') {
    return false
  }

  const restrictions = returnsSiteRestrictions(userScopes)
  if (!restrictions) {
    return false
  }

  return !restrictions.includes(siteCode)
}
