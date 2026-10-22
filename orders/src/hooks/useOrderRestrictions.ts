import { useMemo } from 'react'
import { usePermissions } from '../context/PermissionsProvider'
import { parseRestrictions } from '../helpers/restrictions'

/**
 * Order slice of MD's `RestrictionsProvider`, derived from the IAM scopes the
 * remote `PermissionsProvider` already loads (no extra provider needed).
 */
const ORDER_SCOPES = [
  'order.order_read',
  'order.order_create',
  'order.order_update',
  'order.order_post',
]

export const useOrderRestrictions = (): string[] | null => {
  const { userScopes } = usePermissions()
  return useMemo(
    () => parseRestrictions(ORDER_SCOPES, userScopes),
    [userScopes]
  )
}
