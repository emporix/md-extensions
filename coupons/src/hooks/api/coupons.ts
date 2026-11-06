import { useCallback } from 'react'
import {
  createNewCoupon,
  fetchCoupon,
  fetchCoupons,
  modifyCoupon,
  patchCouponCall,
  removeCoupon,
  type Coupon,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'

/** Port of MD `hooks/api/coupons` — the calls the coupons screens use. */
export const useCouponsApi = () => {
  const { tenant } = useDashboardContext()

  const getCoupon = useCallback(
    (couponCode: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return fetchCoupon(tenant, couponCode)
    },
    [tenant]
  )

  const syncCoupons = useCallback(
    (pagination: Partial<PaginationProps>, q?: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return fetchCoupons(tenant, toApiPagination(pagination), q)
    },
    [tenant]
  )

  const createCoupon = useCallback(
    (coupon: Coupon) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return createNewCoupon(tenant, coupon)
    },
    [tenant]
  )

  const updateCoupon = useCallback(
    (coupon: Coupon, code: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return modifyCoupon(tenant, coupon, code)
    },
    [tenant]
  )

  const patchCoupon = useCallback(
    (coupon: Partial<Coupon>, oldCode: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return patchCouponCall(tenant, coupon, oldCode)
    },
    [tenant]
  )

  const deleteCoupon = useCallback(
    (code: string) => {
      if (!tenant) return Promise.reject(new Error('No tenant'))
      return removeCoupon(tenant, code)
    },
    [tenant]
  )

  return {
    getCoupon,
    syncCoupons,
    createCoupon,
    updateCoupon,
    patchCoupon,
    deleteCoupon,
  }
}
