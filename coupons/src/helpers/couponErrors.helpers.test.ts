import { describe, expect, it } from 'vitest'
import { ValidationError } from '@emporix/api-calls'
import {
  getCouponErrorMessage,
  getCouponFieldErrorText,
  getCouponSaveErrors,
  getCouponTabForField,
  getFirstInvalidCouponTab,
} from './couponErrors.helpers'

const axiosError = (status: number, data: unknown) => ({
  response: { status, data },
})

describe('getCouponSaveErrors', () => {
  it('maps a ValidationError from the interceptor to form fields', () => {
    const error = new ValidationError([
      { field: 'name', message: 'must not be blank' },
      { field: 'discountAbsolute.amount', message: 'must be >= 0' },
    ])
    expect(getCouponSaveErrors(error)).toEqual({
      fieldErrors: [
        { name: 'name', message: 'must not be blank' },
        { name: 'discountAbsolute.amount', message: 'must be >= 0' },
      ],
      unmapped: [],
    })
  })

  it('maps 400 details of other validation types', () => {
    const error = axiosError(400, {
      type: 'validation_failure',
      details: [
        { field: 'restrictions.segments[0]', message: 'unknown segment' },
        { field: 'restrictions.minOrderValue', message: 'invalid' },
      ],
    })
    expect(getCouponSaveErrors(error).fieldErrors).toEqual([
      { name: 'appliesTo', message: 'unknown segment' },
      { name: 'minOrderValue.amount', message: 'invalid' },
    ])
  })

  it('sends unknown fields and duplicates to the toast', () => {
    const error = new ValidationError([
      { field: 'maxRedemptions', message: 'too low' },
      { field: 'restrictions.validFor[1]', message: 'first' },
      { field: 'restrictions.validFor[2]', message: 'second' },
    ])
    expect(getCouponSaveErrors(error)).toEqual({
      fieldErrors: [{ name: 'appliesTo', message: 'first' }],
      unmapped: ['maxRedemptions: too low', 'restrictions.validFor[2]: second'],
    })
  })

  it('maps currencies to their amount fields and other fields to the toast', () => {
    const error = new ValidationError([
      { field: 'discountAbsolute.currency', message: 'unsupported' },
      { field: 'restrictions.minOrderValue.currency', message: 'unsupported' },
      { field: 'discountType', message: 'invalid' },
      { field: 'name', message: '' },
    ])
    expect(getCouponSaveErrors(error)).toEqual({
      fieldErrors: [
        { name: 'discountAbsolute.amount', message: 'unsupported' },
        { name: 'minOrderValue.amount', message: 'unsupported' },
      ],
      unmapped: ['discountType: invalid', 'name: '],
    })
  })

  it('handles errors without validation details', () => {
    expect(getCouponSaveErrors(new Error('offline'))).toEqual({
      fieldErrors: [],
      unmapped: [],
    })
    expect(
      getCouponSaveErrors(new ValidationError(undefined as never))
    ).toEqual({
      fieldErrors: [],
      unmapped: [],
    })
    expect(getCouponSaveErrors(axiosError(409, { details: [] }))).toEqual({
      fieldErrors: [],
      unmapped: [],
    })
  })
})

describe('getCouponErrorMessage', () => {
  it('reads the API message or a string rejection', () => {
    expect(getCouponErrorMessage(axiosError(500, { message: 'boom' }))).toBe(
      'boom'
    )
    expect(getCouponErrorMessage('No tenant provided')).toBe(
      'No tenant provided'
    )
    expect(getCouponErrorMessage(new Error('offline'))).toBeUndefined()
  })
})

describe('getCouponTabForField', () => {
  it('returns the tab of a field', () => {
    expect(getCouponTabForField('code')).toBe('general')
    expect(getCouponTabForField('discountAbsolute.amount')).toBe('types')
    expect(getCouponTabForField('appliesTo')).toBe('rules')
  })
})

describe('getFirstInvalidCouponTab', () => {
  it('returns the first tab in tab order', () => {
    expect(getFirstInvalidCouponTab(['appliesTo', 'discountPercentage'])).toBe(
      'types'
    )
    expect(getFirstInvalidCouponTab(['validUntil', 'name'])).toBe('general')
    expect(getFirstInvalidCouponTab([])).toBeUndefined()
  })
})

describe('getCouponFieldErrorText', () => {
  const t = (key: string) => `t(${key})`

  it('translates client rules and keeps server messages', () => {
    expect(
      getCouponFieldErrorText({ type: 'validate', message: 'a.key' }, t)
    ).toBe('t(a.key)')
    expect(
      getCouponFieldErrorText({ type: 'server', message: 'From API' }, t)
    ).toBe('From API')
    expect(getCouponFieldErrorText(undefined, t)).toBeUndefined()
  })
})
