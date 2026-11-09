import type { CouponFormFields } from './couponForm.helpers'
import {
  CouponAppliesTo,
  isCategoriesAllowedForDiscountType,
} from './couponRestrictions.helpers'

/** `true` when valid, otherwise an i18n key with the message. */
export type CouponValidationResult = true | string

const KEY = 'coupons.edit.validation'

export const RESERVED_COUPON_CODE = 'add'

export const validateCouponName = (value: string): CouponValidationResult =>
  value.trim() ? true : `${KEY}.required`

export const validateCouponCode = (
  value: string,
  isCreate: boolean
): CouponValidationResult =>
  isCreate && value.trim().toLowerCase() === RESERVED_COUPON_CODE
    ? `${KEY}.codeReserved`
    : true

export const validateDiscountPercentage = (
  value: number | null,
  form: Pick<CouponFormFields, 'discountType'>
): CouponValidationResult => {
  if (form.discountType !== 'PERCENT') return true
  if (value === null || value === undefined) return `${KEY}.required`
  if (value < 0 || value > 100) return `${KEY}.percentageRange`
  return true
}

export const validateDiscountAmount = (
  value: number | null,
  form: Pick<CouponFormFields, 'discountType'>
): CouponValidationResult => {
  if (form.discountType !== 'ABSOLUTE') return true
  if (value === null || value === undefined) return `${KEY}.required`
  if (value < 0) return `${KEY}.amountNonNegative`
  return true
}

export const validateMinOrderAmount = (
  value: number | null
): CouponValidationResult =>
  value !== null && value !== undefined && value < 0
    ? `${KEY}.amountNonNegative`
    : true

export const validateValidUntil = (
  value: Date | null,
  form: Pick<CouponFormFields, 'validFrom'>
): CouponValidationResult =>
  value && form.validFrom && value.getTime() < form.validFrom.getTime()
    ? `${KEY}.validityOrder`
    : true

/**
 * Lives on the always-mounted `appliesTo` field, because the list selectors are
 * only mounted for the selected card.
 */
export const validateAppliesTo = (
  value: CouponAppliesTo,
  form: Pick<
    CouponFormFields,
    | 'discountType'
    | 'validFor'
    | 'segments'
    | 'includedCategories'
    | 'excludedCategories'
  >
): CouponValidationResult => {
  if (
    value === 'CATEGORIES' &&
    !isCategoriesAllowedForDiscountType(form.discountType)
  ) {
    return `${KEY}.categoriesNotForFreeShipping`
  }
  if (value === 'SPECIFIC_CUSTOMERS' && form.validFor.length === 0) {
    return `${KEY}.customersRequired`
  }
  if (value === 'SEGMENTS' && form.segments.length === 0) {
    return `${KEY}.segmentsRequired`
  }
  if (
    value === 'CATEGORIES' &&
    form.includedCategories.length === 0 &&
    form.excludedCategories.length === 0
  ) {
    return `${KEY}.categoriesRequired`
  }
  return true
}

export const validateExcludedCategories = (
  value: string[],
  form: Pick<CouponFormFields, 'appliesTo' | 'includedCategories'>
): CouponValidationResult => {
  if (form.appliesTo !== 'CATEGORIES') return true
  const included = new Set(form.includedCategories)
  return value.some((id) => included.has(id))
    ? `${KEY}.categoriesOverlap`
    : true
}
