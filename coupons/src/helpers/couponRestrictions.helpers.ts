import type { Coupon, DiscountType } from '@emporix/api-calls'
import type { CouponListFieldName } from './couponForm.helpers'

export type CouponAppliesTo =
  | 'ALL_CUSTOMERS'
  | 'REGISTERED_CUSTOMERS'
  | 'SPECIFIC_CUSTOMERS'
  | 'SEGMENTS'
  | 'CATEGORIES'

export interface CouponAppliesToFlags {
  allowAnonymous: boolean
  segmentRestricted: boolean
  categoryRestricted: boolean
}

export const COUPON_APPLIES_TO_OPTIONS: CouponAppliesTo[] = [
  'ALL_CUSTOMERS',
  'REGISTERED_CUSTOMERS',
  'SPECIFIC_CUSTOMERS',
  'SEGMENTS',
  'CATEGORIES',
]

const APPLIES_TO_FLAGS: Record<CouponAppliesTo, CouponAppliesToFlags> = {
  ALL_CUSTOMERS: {
    allowAnonymous: true,
    segmentRestricted: false,
    categoryRestricted: false,
  },
  REGISTERED_CUSTOMERS: {
    allowAnonymous: false,
    segmentRestricted: false,
    categoryRestricted: false,
  },
  SPECIFIC_CUSTOMERS: {
    allowAnonymous: false,
    segmentRestricted: false,
    categoryRestricted: false,
  },
  SEGMENTS: {
    allowAnonymous: true,
    segmentRestricted: true,
    categoryRestricted: false,
  },
  CATEGORIES: {
    allowAnonymous: true,
    segmentRestricted: false,
    categoryRestricted: true,
  },
}

const APPLIES_TO_LISTS: Record<CouponAppliesTo, CouponListFieldName[]> = {
  ALL_CUSTOMERS: [],
  REGISTERED_CUSTOMERS: [],
  SPECIFIC_CUSTOMERS: ['validFor'],
  SEGMENTS: ['segments'],
  CATEGORIES: ['includedCategories', 'excludedCategories'],
}

/**
 * Same precedence as the old radio derivation: segment flag, category flag,
 * customer list, then anonymous access. An empty customer list no longer counts
 * as "specific customers".
 */
export const getCouponAppliesTo = (
  coupon: Partial<Coupon>
): CouponAppliesTo => {
  if (coupon.segmentRestricted) return 'SEGMENTS'
  if (coupon.categoryRestricted) return 'CATEGORIES'
  if ((coupon.restrictions?.validFor?.length ?? 0) > 0) {
    return 'SPECIFIC_CUSTOMERS'
  }
  if (!coupon.allowAnonymous) return 'REGISTERED_CUSTOMERS'
  return 'ALL_CUSTOMERS'
}

export const getCouponAppliesToFlags = (
  appliesTo: CouponAppliesTo
): CouponAppliesToFlags => ({ ...APPLIES_TO_FLAGS[appliesTo] })

export const getCouponAppliesToListKeys = (
  appliesTo: CouponAppliesTo
): CouponListFieldName[] => [...APPLIES_TO_LISTS[appliesTo]]

export const isCategoriesAllowedForDiscountType = (
  discountType: DiscountType
): boolean => discountType !== 'FREE_SHIPPING'
