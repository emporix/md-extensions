import { useCallback } from 'react'
import { listShippingZonesCall } from '@emporix/api-calls/next'
import { Zone } from '../../models/Shipping.model'
import { useDashboardContext } from '../../context/Dashboard.context'

type Name = string | Record<string, string> | undefined

/**
 * MD read the zones with `Accept-Language: en`, so zone and method names were
 * English strings; the Preview shows them and saves the method name on the
 * quote. The new call returns every translation, so take the English one
 * (or the first, when there is no English name).
 */
const toEnglishName = (name: Name): string =>
  typeof name === 'string'
    ? name
    : (name?.en ?? Object.values(name ?? {})[0] ?? '')

/**
 * Shipping zones bound to the host tenant, as MD `hooks/api/shipping`, on
 * `@emporix/api-calls/next`.
 */
export const useShippingApi = () => {
  const { tenant } = useDashboardContext()

  const getZones = useCallback(
    async (site: string) => {
      if (!tenant) {
        return Promise.reject('no tenant')
      }
      const zones = await listShippingZonesCall(
        site,
        { expand: 'methods,fees' },
        { tenant }
      )
      return zones.map((zone) => ({
        ...zone,
        name: toEnglishName(zone.name),
        methods: zone.methods?.map((method) => ({
          ...method,
          name: toEnglishName(method.name),
        })),
      })) as unknown as Zone[]
    },
    [tenant]
  )

  return { getZones }
}
