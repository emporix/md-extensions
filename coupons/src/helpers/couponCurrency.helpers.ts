import type { Coupon } from '@emporix/api-calls'

/**
 * The coupon form displays the selected currency as a fallback when a money
 * field has no currency yet, but the API defaults a missing currency to USD.
 * Persist the displayed fallback so the saved value matches what the user saw.
 */
export const fillMissingCouponCurrencies = (
  coupon: Partial<Coupon>,
  fallbackCurrency: string | undefined
): Partial<Coupon> => {
  if (!fallbackCurrency) {
    return coupon
  }

  const { discountAbsolute, restrictions } = coupon
  const minOrderValue = restrictions?.minOrderValue
  const isDiscountCurrencyMissing =
    !!discountAbsolute && !discountAbsolute.currency
  const isMinOrderCurrencyMissing = !!minOrderValue && !minOrderValue.currency

  if (!isDiscountCurrencyMissing && !isMinOrderCurrencyMissing) {
    return coupon
  }

  const updatedCoupon = { ...coupon }
  if (discountAbsolute && isDiscountCurrencyMissing) {
    updatedCoupon.discountAbsolute = {
      ...discountAbsolute,
      currency: fallbackCurrency,
    }
  }
  if (minOrderValue && isMinOrderCurrencyMissing) {
    updatedCoupon.restrictions = {
      ...restrictions,
      minOrderValue: { ...minOrderValue, currency: fallbackCurrency },
    }
  }
  return updatedCoupon
}
