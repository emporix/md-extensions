import { useCallback } from 'react'
import { api } from '.'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { PaginatedResponse } from './orders'
import { useTenant } from '../context/TenantProvider'
import { Mixins } from '../models/Mixins'
import { Metadata } from '../models/Metadata'

export type DiscountType = 'PERCENT' | 'ABSOLUTE' | 'FREE_SHIPPING'

interface MoneyAmount {
  amount: number
  currency: string
}

export interface Coupon {
  id: string
  code: string
  description: string
  name: string
  discountType: DiscountType
  discountCalculationType: string
  discountPercentage: number
  discountAbsolute: MoneyAmount
  allowAnonymous: boolean
  maxRedemptions: number
  redemptionCount: number
  maxRedemptionsPerCustomer: number
  categoryRestricted: boolean
  segmentRestricted: boolean
  restrictions: {
    validFor?: string[]
    validFrom?: string
    validUntil?: string
    minOrderValue?: MoneyAmount
    includedCategories?: string[]
    excludedCategories?: string[]
    segments?: string[]
  }
  issuedTo: string
  metadata: Metadata
  mixins: Mixins
}

export enum DiscountCalculationBase {
  TOTAL = 'TOTAL',
  SUBTOTAL = 'SUBTOTAL',
}

export const removeCoupon = async (tenant: string, couponId: string) => {
  const deleteResponse = await api.delete(
    `/coupon/${tenant}/coupons/${couponId}`
  )
  return deleteResponse.data
}

export const fetchCoupon = async (
  tenant: string,
  couponCode: string
): Promise<Coupon> => {
  const catalogResponse = await api.get<Coupon>(
    `/coupon/${tenant}/coupons/${couponCode}`
  )
  return catalogResponse.data
}

export const createNewCoupon = async (
  tenant: string,
  coupon: Coupon
): Promise<string> => {
  const catalogResponse = await api.post<Partial<Coupon>>(
    `/coupon/${tenant}/coupons/`,
    {
      ...coupon,
    }
  )
  return catalogResponse.data.id as string
}

export const modifyCoupon = async (
  tenant: string,
  coupon: Coupon,
  oldCode: string
): Promise<boolean> => {
  const catalogResponse = await api.put<Coupon>(
    `/coupon/${tenant}/coupons/${oldCode}`,
    { ...coupon },
    { params: { partial: false } }
  )
  return catalogResponse.status === 201
}

export const patchCouponCall = async (
  tenant: string,
  coupon: Partial<Coupon>,
  oldCode: string
): Promise<boolean> => {
  const couponResponse = await api.patch<Coupon>(
    `/coupon/${tenant}/coupons/${oldCode}`,
    { ...coupon }
  )
  return couponResponse.status === 201
}

export const fetchCoupons = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  q?: string
): Promise<PaginatedResponse<Coupon>> => {
  const params = {
    sort: formatPaginationParamsForSorting(pagination),
    ...formatPaginationParamsForEmporixPagination(pagination),
    totalCount: true,
    q: [q, formatFilterQuery(pagination.filters)]
      .filter((val) => val !== undefined && val !== '')
      .join(' '),
  }
  const { data, headers } = await api.get<Coupon[]>(
    `/coupon/${tenant}/coupons`,
    { params }
  )
  return { values: data, totalRecords: +headers['hybris-count'] }
}

export const useCouponsApi = () => {
  const { tenant } = useTenant()

  const getCoupon = useCallback(
    (couponCode: string) => {
      if (tenant) {
        return fetchCoupon(tenant, couponCode)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getReferralCoupon = useCallback(
    async (customerId: string) => {
      if (tenant) {
        const q = `issuedTo:${customerId} referralCoupon:true`
        const { values } = await fetchCoupons(tenant, {}, q)
        return values.length != 0 ? values[0] : null
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateCoupon = useCallback(
    (coupon: Coupon, code: string) => {
      if (tenant) {
        return modifyCoupon(tenant, coupon, code)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const patchCoupon = useCallback(
    (coupon: Partial<Coupon>, oldCode: string) => {
      if (tenant) {
        return patchCouponCall(tenant, coupon, oldCode)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createCoupon = useCallback(
    (coupon: Coupon) => {
      if (tenant) {
        return createNewCoupon(tenant, coupon)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const syncCoupons = useCallback(
    (pagination: Partial<PaginationProps>, q?: string) => {
      if (tenant) {
        return fetchCoupons(tenant, pagination, q)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getCouponsBySegmentId = useCallback(
    (pagination: Partial<PaginationProps>, segmentId: string) => {
      const q = `restrictions.segments:in(${segmentId})`
      if (tenant) {
        return fetchCoupons(tenant, pagination, q)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteCoupon = useCallback(
    (couponId: string) => {
      if (tenant) {
        return removeCoupon(tenant, couponId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  return {
    updateCoupon,
    patchCoupon,
    createCoupon,
    syncCoupons,
    getCouponsBySegmentId,
    deleteCoupon,
    getCoupon,
    DiscountCalculationBase,
    getReferralCoupon,
  }
}
