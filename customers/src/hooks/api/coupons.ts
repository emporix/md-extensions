import { useCallback } from 'react'
import { fetchCoupons } from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'

/** Port of MD `hooks/api/coupons` — only the call the customer page uses. */
export const useCouponsApi = () => {
  const { tenant } = useDashboardContext()

  /** The referral coupon issued to a customer, or `null` (MD `getReferralCoupon`). */
  const getReferralCoupon = useCallback(
    async (customerId: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      const q = `issuedTo:${customerId} referralCoupon:true`
      const { values } = await fetchCoupons(tenant, {}, q)
      return values.length > 0 ? values[0] : null
    },
    [tenant]
  )

  return { getReferralCoupon }
}
