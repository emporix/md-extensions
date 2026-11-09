import type { DiscountType } from '@emporix/api-calls'
import { getCouponErrorMessage } from './couponErrors.helpers'

export const COUPON_DISCOUNT_TYPE_LABEL_KEYS: Record<DiscountType, string> = {
  PERCENT: 'coupons.type.percent',
  ABSOLUTE: 'coupons.type.absolute',
  FREE_SHIPPING: 'coupons.type.freeShipping',
}

export const getCouponDiscountTypeLabelKey = (
  discountType: string | undefined
): string | undefined =>
  discountType
    ? COUPON_DISCOUNT_TYPE_LABEL_KEYS[discountType as DiscountType]
    : undefined

/**
 * After deleting the last rows of the last page the API returns an empty page.
 * Returns the page to move to, or null when the current page is fine.
 */
export const getPageAfterEmptyResult = (
  currentPage: number | undefined,
  rows: number | undefined,
  rowCount: number,
  totalRecords: number
): number | null => {
  const page = currentPage ?? 1
  const pageSize = rows && rows > 0 ? rows : 10
  if (rowCount > 0 || totalRecords <= 0 || page <= 1) return null
  const lastPage = Math.max(1, Math.ceil(totalRecords / pageSize))
  return lastPage < page ? lastPage : null
}

export interface CouponDeleteFailure {
  code: string
  message?: string
}

export interface CouponDeleteSummary {
  deleted: string[]
  failed: CouponDeleteFailure[]
}

export const summarizeCouponDeletes = (
  codes: string[],
  results: PromiseSettledResult<unknown>[]
): CouponDeleteSummary =>
  results.reduce<CouponDeleteSummary>(
    (summary, result, index) => {
      const code = codes[index]
      if (result.status === 'fulfilled') {
        return { ...summary, deleted: [...summary.deleted, code] }
      }
      return {
        ...summary,
        failed: [
          ...summary.failed,
          { code, message: getCouponErrorMessage(result.reason) },
        ],
      }
    },
    { deleted: [], failed: [] }
  )
