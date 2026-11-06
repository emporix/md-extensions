import type { Coupon, DiscountType, MoneyAmount } from '@emporix/api-calls'
import { fillMissingCouponCurrencies } from './couponCurrency.helpers'
import {
  CouponAppliesTo,
  getCouponAppliesTo,
  getCouponAppliesToFlags,
  getCouponAppliesToListKeys,
} from './couponRestrictions.helpers'

export type { CouponAppliesTo } from './couponRestrictions.helpers'

export interface CouponMoneyFields {
  amount: number | null
  currency: string | null
}

export interface CouponFormFields {
  code: string
  name: string
  description: string
  discountType: DiscountType
  discountPercentage: number | null
  discountAbsolute: CouponMoneyFields
  discountCalculationType: string
  validFrom: Date | null
  validUntil: Date | null
  minOrderValue: CouponMoneyFields
  appliesTo: CouponAppliesTo
  validFor: string[]
  segments: string[]
  includedCategories: string[]
  excludedCategories: string[]
  vendorRestricted: boolean
  vendors: string[]
}

export type CouponListFieldName =
  | 'validFor'
  | 'segments'
  | 'includedCategories'
  | 'excludedCategories'

type CouponRestrictions = Coupon['restrictions']

export const DEFAULT_DISCOUNT_CALCULATION_TYPE = 'SUBTOTAL'

export const createCouponForm = (): CouponFormFields => ({
  code: '',
  name: '',
  description: '',
  discountType: 'ABSOLUTE',
  discountPercentage: null,
  discountAbsolute: { amount: 0, currency: null },
  discountCalculationType: DEFAULT_DISCOUNT_CALCULATION_TYPE,
  validFrom: null,
  validUntil: null,
  minOrderValue: { amount: null, currency: null },
  appliesTo: 'REGISTERED_CUSTOMERS',
  validFor: [],
  segments: [],
  includedCategories: [],
  excludedCategories: [],
  vendorRestricted: false,
  vendors: [],
})

export const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = String(value).replace(',', '.').replace('%', '').trim()
  if (normalized === '') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const toDateOrNull = (value: string | undefined | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const isSameDate = (a: Date | null, b: Date | null): boolean => {
  if (a === null || b === null) return a === b
  return a.getTime() === b.getTime()
}

export const isSameIdList = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false
  const ids = new Set(a)
  return b.every((id) => ids.has(id))
}

const isSameMoney = (a: CouponMoneyFields, b: CouponMoneyFields): boolean =>
  a.amount === b.amount && a.currency === b.currency

const toMoneyAmount = (amount: number, currency: string | null): MoneyAmount =>
  (currency ? { amount, currency } : { amount }) as MoneyAmount

export const mapCouponToForm = (coupon: Coupon): CouponFormFields => {
  const restrictions: Partial<CouponRestrictions> = coupon.restrictions ?? {}
  const vendors = restrictions.vendors ?? []
  return {
    code: coupon.code ?? '',
    name: coupon.name ?? '',
    description: coupon.description ?? '',
    discountType: coupon.discountType ?? 'ABSOLUTE',
    discountPercentage: toNumberOrNull(coupon.discountPercentage),
    discountAbsolute: {
      amount: toNumberOrNull(coupon.discountAbsolute?.amount) ?? 0,
      currency: coupon.discountAbsolute?.currency || null,
    },
    discountCalculationType:
      coupon.discountCalculationType || DEFAULT_DISCOUNT_CALCULATION_TYPE,
    validFrom: toDateOrNull(restrictions.validFrom),
    validUntil: toDateOrNull(restrictions.validUntil),
    minOrderValue: {
      amount: toNumberOrNull(restrictions.minOrderValue?.amount),
      currency: restrictions.minOrderValue?.currency || null,
    },
    appliesTo: getCouponAppliesTo(coupon),
    validFor: restrictions.validFor ?? [],
    segments: restrictions.segments ?? [],
    includedCategories: restrictions.includedCategories ?? [],
    excludedCategories: restrictions.excludedCategories ?? [],
    vendorRestricted: coupon.vendorRestricted ?? vendors.length > 0,
    vendors,
  }
}

const isDiscountChanged = (
  form: CouponFormFields,
  initial: CouponFormFields
): boolean =>
  form.discountType !== initial.discountType ||
  form.discountPercentage !== initial.discountPercentage ||
  !isSameMoney(form.discountAbsolute, initial.discountAbsolute) ||
  form.discountCalculationType !== initial.discountCalculationType

const applyDiscount = (
  payload: Partial<Coupon>,
  form: CouponFormFields,
  coupon: Coupon | undefined
) => {
  payload.discountType = form.discountType
  delete payload.discountPercentage
  delete payload.discountAbsolute
  if (form.discountType === 'PERCENT') {
    payload.discountPercentage = form.discountPercentage ?? 0
  }
  if (form.discountType === 'ABSOLUTE') {
    payload.discountAbsolute = toMoneyAmount(
      form.discountAbsolute.amount ?? 0,
      form.discountAbsolute.currency
    )
  }
  const sendsCalculationType =
    form.discountType !== 'FREE_SHIPPING' &&
    (!!coupon?.discountCalculationType ||
      form.discountCalculationType !== DEFAULT_DISCOUNT_CALCULATION_TYPE)
  if (sendsCalculationType) {
    payload.discountCalculationType = form.discountCalculationType
  }
}

const applyDate = (
  restrictions: Partial<CouponRestrictions>,
  key: 'validFrom' | 'validUntil',
  value: Date | null,
  initialValue: Date | null
) => {
  if (isSameDate(value, initialValue)) return
  if (value) {
    restrictions[key] = value.toISOString()
  } else {
    delete restrictions[key]
  }
}

const applyAppliesTo = (
  payload: Partial<Coupon>,
  restrictions: Partial<CouponRestrictions>,
  form: CouponFormFields,
  initial: CouponFormFields | undefined
) => {
  const listKeys = getCouponAppliesToListKeys(form.appliesTo)
  if (initial && initial.appliesTo === form.appliesTo) {
    listKeys.forEach((key) => {
      if (!isSameIdList(form[key], initial[key])) {
        restrictions[key] = form[key]
      }
    })
    return
  }
  Object.assign(payload, getCouponAppliesToFlags(form.appliesTo))
  delete restrictions.validFor
  delete restrictions.segments
  delete restrictions.includedCategories
  delete restrictions.excludedCategories
  listKeys.forEach((key) => {
    if (key === 'excludedCategories' && form[key].length === 0) return
    restrictions[key] = form[key]
  })
}

const applyVendors = (
  payload: Partial<Coupon>,
  restrictions: Partial<CouponRestrictions>,
  form: CouponFormFields,
  initial: CouponFormFields | undefined
) => {
  const isChanged =
    !initial ||
    form.vendorRestricted !== initial.vendorRestricted ||
    !isSameIdList(form.vendors, initial.vendors)
  if (!isChanged) return
  payload.vendorRestricted = form.vendorRestricted
  if (form.vendorRestricted) {
    restrictions.vendors = form.vendors
  } else {
    delete restrictions.vendors
  }
}

/**
 * Builds the coupon payload from the form.
 *
 * On edit the payload starts from the stored coupon, because the API replaces the
 * whole object on PUT (partial=false). Groups of fields the user did not change are
 * sent back exactly as stored, so combinations the form cannot express (for example
 * segments and categories set together by the Segments module) survive a save.
 */
export const mapCouponFormToPayload = (
  form: CouponFormFields,
  coupon?: Coupon,
  fallbackCurrency?: string
): Partial<Coupon> => {
  const initial = coupon ? mapCouponToForm(coupon) : undefined
  const payload: Partial<Coupon> = coupon ? { ...coupon } : {}
  const restrictions: Partial<CouponRestrictions> = {
    ...(coupon?.restrictions ?? {}),
  }

  if (!coupon) {
    const code = form.code.trim()
    if (code) payload.code = code
  }

  if (!initial || form.name !== initial.name) {
    payload.name = form.name.trim()
  }

  if (!initial || form.description !== initial.description) {
    if (form.description.trim()) {
      payload.description = form.description
    } else {
      delete payload.description
    }
  }

  if (!initial || isDiscountChanged(form, initial)) {
    applyDiscount(payload, form, coupon)
  } else if (typeof coupon?.discountPercentage === 'string') {
    payload.discountPercentage = form.discountPercentage ?? undefined
  }

  applyDate(
    restrictions,
    'validFrom',
    form.validFrom,
    initial?.validFrom ?? null
  )
  applyDate(
    restrictions,
    'validUntil',
    form.validUntil,
    initial?.validUntil ?? null
  )

  if (!initial || !isSameMoney(form.minOrderValue, initial.minOrderValue)) {
    const { amount, currency } = form.minOrderValue
    if (amount !== null && amount > 0) {
      restrictions.minOrderValue = toMoneyAmount(amount, currency)
    } else {
      delete restrictions.minOrderValue
    }
  }

  applyAppliesTo(payload, restrictions, form, initial)
  applyVendors(payload, restrictions, form, initial)

  if (coupon?.restrictions || Object.keys(restrictions).length > 0) {
    payload.restrictions = restrictions as CouponRestrictions
  }

  return fillMissingCouponCurrencies(payload, fallbackCurrency)
}
