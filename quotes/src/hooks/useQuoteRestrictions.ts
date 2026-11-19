import { useMemo } from 'react'
import { usePermissions } from '../context/PermissionsProvider'
import {
  parseRestrictions,
  QUOTE_RESTRICTION_SCOPES,
} from '../helpers/restrictions'

/**
 * MD `useRestrictions().quoteRestrictions`, derived from the IAM scopes the
 * remote `PermissionsProvider` already loads (no extra provider needed):
 * `null` for full access, otherwise the restriction (site) codes.
 */
export const useQuoteRestrictions = (): string[] | null => {
  const { userScopes } = usePermissions()
  return useMemo(
    () => parseRestrictions(QUOTE_RESTRICTION_SCOPES, userScopes),
    [userScopes]
  )
}
