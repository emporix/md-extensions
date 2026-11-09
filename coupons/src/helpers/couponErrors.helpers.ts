import { ValidationError } from '@emporix/api-calls'
import type { FieldError, FieldPath } from 'react-hook-form'
import type { CouponFormFields } from './couponForm.helpers'

export type CouponFormFieldName = FieldPath<CouponFormFields>
export type CouponTab = 'general' | 'types' | 'rules'

export interface CouponFieldError {
  name: CouponFormFieldName
  message: string
}

export interface CouponSaveErrors {
  fieldErrors: CouponFieldError[]
  unmapped: string[]
}

interface ApiFieldError {
  field?: string
  message?: string
}

/**
 * API field names (bean notation, list indexes removed) mapped to form fields that
 * show an error and are mounted whenever the API field is sent. List restrictions
 * map to the `appliesTo` card group and currencies to their amount field. Other
 * fields go to the toast.
 */
const API_FIELD_TO_FORM_FIELD: Record<string, CouponFormFieldName> = {
  name: 'name',
  code: 'code',
  description: 'description',
  discountPercentage: 'discountPercentage',
  discountAbsolute: 'discountAbsolute.amount',
  'discountAbsolute.amount': 'discountAbsolute.amount',
  'discountAbsolute.currency': 'discountAbsolute.amount',
  'restrictions.validFrom': 'validFrom',
  'restrictions.validUntil': 'validUntil',
  'restrictions.minOrderValue': 'minOrderValue.amount',
  'restrictions.minOrderValue.amount': 'minOrderValue.amount',
  'restrictions.minOrderValue.currency': 'minOrderValue.amount',
  allowAnonymous: 'appliesTo',
  segmentRestricted: 'appliesTo',
  categoryRestricted: 'appliesTo',
  'restrictions.validFor': 'appliesTo',
  'restrictions.segments': 'appliesTo',
  'restrictions.includedCategories': 'appliesTo',
  'restrictions.excludedCategories': 'appliesTo',
  vendorRestricted: 'vendorRestricted',
  'restrictions.vendors': 'vendorRestricted',
}

const TAB_BY_FIELD: Record<string, CouponTab> = {
  name: 'general',
  code: 'general',
  description: 'general',
  discountType: 'types',
  discountPercentage: 'types',
  discountAbsolute: 'types',
  discountCalculationType: 'types',
}

const TAB_ORDER: CouponTab[] = ['general', 'types', 'rules']

const normalizeApiField = (field: string): string =>
  field.replace(/\[\d+\]/g, '').trim()

const getApiFieldErrors = (error: unknown): ApiFieldError[] => {
  if (error instanceof ValidationError) {
    return Array.isArray(error.errors) ? error.errors : []
  }
  const response = (
    error as {
      response?: { status?: number; data?: { details?: unknown } }
    }
  )?.response
  const details = response?.data?.details
  return response?.status === 400 && Array.isArray(details) ? details : []
}

export const getCouponSaveErrors = (error: unknown): CouponSaveErrors => {
  const result: CouponSaveErrors = { fieldErrors: [], unmapped: [] }
  getApiFieldErrors(error).forEach(({ field, message }) => {
    const name = field
      ? API_FIELD_TO_FORM_FIELD[normalizeApiField(field)]
      : undefined
    const text = message ?? ''
    const isTaken = result.fieldErrors.some((e) => e.name === name)
    if (name && text && !isTaken) {
      result.fieldErrors.push({ name, message: text })
    } else if (field || text) {
      result.unmapped.push(field ? `${field}: ${text}` : text)
    }
  })
  return result
}

export const getCouponErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error
  const data = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data
  if (typeof data?.message === 'string') return data.message
  return undefined
}

export const getCouponTabForField = (name: string): CouponTab =>
  TAB_BY_FIELD[name.split('.')[0]] ?? 'rules'

export const getFirstInvalidCouponTab = (
  fieldNames: string[]
): CouponTab | undefined => {
  const tabs = new Set(fieldNames.map(getCouponTabForField))
  return TAB_ORDER.find((tab) => tabs.has(tab))
}

/** Client rules store i18n keys; server errors keep the API message. */
export const getCouponFieldErrorText = (
  error: FieldError | undefined,
  t: (key: string) => string
): string | undefined => {
  if (!error?.message) return undefined
  return error.type === 'server' ? error.message : t(error.message)
}
