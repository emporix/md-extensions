import { describe, expect, it } from 'vitest'
import type { Coupon } from '@emporix/api-calls'
import {
  CouponFormFields,
  createCouponForm,
  mapCouponFormToPayload,
  mapCouponToForm,
  toNumberOrNull,
} from './couponForm.helpers'

const storedCoupon = (overrides: Partial<Coupon> = {}): Coupon =>
  ({
    id: 'SUMMER',
    code: 'SUMMER',
    name: 'Summer sale',
    description: 'Ten percent off',
    discountType: 'PERCENT',
    discountPercentage: 10,
    discountCalculationType: 'SUBTOTAL',
    allowAnonymous: false,
    segmentRestricted: false,
    categoryRestricted: false,
    maxRedemptions: 5,
    maxRedemptionsPerCustomer: 1,
    issuedTo: 'C-1',
    restrictions: {
      validFrom: '2026-01-01T10:00:00Z',
      minOrderValue: { amount: 50, currency: 'EUR' },
    },
    mixins: { general: { color: 'red' } },
    metadata: { version: 3, mixins: { general: 'https://schema/general' } },
    ...overrides,
  }) as unknown as Coupon

const formFor = (
  coupon: Coupon,
  changes: Partial<CouponFormFields>
): CouponFormFields => ({ ...mapCouponToForm(coupon), ...changes })

describe('toNumberOrNull', () => {
  it('parses numbers and legacy strings', () => {
    expect(toNumberOrNull(12)).toBe(12)
    expect(toNumberOrNull('12,5')).toBe(12.5)
    expect(toNumberOrNull('15%')).toBe(15)
  })

  it('returns null for empty or invalid values', () => {
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('abc')).toBeNull()
    expect(toNumberOrNull(Number.NaN)).toBeNull()
  })
})

describe('createCouponForm', () => {
  it('starts as an absolute discount for registered customers', () => {
    const form = createCouponForm()
    expect(form.discountType).toBe('ABSOLUTE')
    expect(form.discountAbsolute).toEqual({ amount: 0, currency: null })
    expect(form.appliesTo).toBe('REGISTERED_CUSTOMERS')
    expect(form.discountCalculationType).toBe('SUBTOTAL')
    expect(form.minOrderValue).toEqual({ amount: null, currency: null })
  })
})

describe('mapCouponToForm', () => {
  it('maps the stored coupon to form values', () => {
    const form = mapCouponToForm(storedCoupon())
    expect(form).toMatchObject({
      code: 'SUMMER',
      name: 'Summer sale',
      discountType: 'PERCENT',
      discountPercentage: 10,
      appliesTo: 'REGISTERED_CUSTOMERS',
      minOrderValue: { amount: 50, currency: 'EUR' },
      validUntil: null,
    })
    expect(form.validFrom?.toISOString()).toBe('2026-01-01T10:00:00.000Z')
  })

  it.each([
    [{ segmentRestricted: true, categoryRestricted: true }, 'SEGMENTS'],
    [{ categoryRestricted: true }, 'CATEGORIES'],
    [{ restrictions: { validFor: ['C-1'] } }, 'SPECIFIC_CUSTOMERS'],
    [{ restrictions: { validFor: [] } }, 'REGISTERED_CUSTOMERS'],
    [{ allowAnonymous: true }, 'ALL_CUSTOMERS'],
    [{ allowAnonymous: true, restrictions: { validFor: [] } }, 'ALL_CUSTOMERS'],
  ])('derives the applies-to option from %j', (overrides, expected) => {
    const coupon = storedCoupon(overrides as Partial<Coupon>)
    expect(mapCouponToForm(coupon).appliesTo).toBe(expected)
  })

  it('reads a percentage stored as a string', () => {
    const coupon = storedCoupon({
      discountPercentage: '12,5' as unknown as number,
    })
    expect(mapCouponToForm(coupon).discountPercentage).toBe(12.5)
  })

  it('handles a coupon without restrictions, mixins and metadata', () => {
    const coupon = { code: 'X', name: 'X' } as unknown as Coupon
    const form = mapCouponToForm(coupon)
    expect(form.validFor).toEqual([])
    expect(form.discountCalculationType).toBe('SUBTOTAL')
    expect(form.vendorRestricted).toBe(false)
  })

  it('treats stored vendors without the flag as vendor restricted', () => {
    const coupon = storedCoupon({
      restrictions: { vendors: ['V-1'] },
    } as Partial<Coupon>)
    expect(mapCouponToForm(coupon).vendorRestricted).toBe(true)
  })
})

describe('mapCouponFormToPayload on create', () => {
  const createForm = (changes: Partial<CouponFormFields> = {}) => ({
    ...createCouponForm(),
    name: '  Winter  ',
    ...changes,
  })

  it('builds an absolute coupon with the fallback currency', () => {
    const payload = mapCouponFormToPayload(
      createForm({
        code: ' WINTER ',
        discountAbsolute: { amount: 5, currency: null },
      }),
      undefined,
      'EUR'
    )
    expect(payload).toEqual({
      code: 'WINTER',
      name: 'Winter',
      discountType: 'ABSOLUTE',
      discountAbsolute: { amount: 5, currency: 'EUR' },
      allowAnonymous: false,
      segmentRestricted: false,
      categoryRestricted: false,
      vendorRestricted: false,
    })
  })

  it('omits an empty code so the API generates one', () => {
    expect(mapCouponFormToPayload(createForm()).code).toBeUndefined()
  })

  it('sends a percentage as a number without the absolute discount', () => {
    const payload = mapCouponFormToPayload(
      createForm({ discountType: 'PERCENT', discountPercentage: 12.5 })
    )
    expect(payload.discountPercentage).toBe(12.5)
    expect(payload.discountAbsolute).toBeUndefined()
    expect(payload.discountCalculationType).toBeUndefined()
  })

  it('sends the calculation base only when it differs from the default', () => {
    const payload = mapCouponFormToPayload(
      createForm({
        discountType: 'PERCENT',
        discountPercentage: 5,
        discountCalculationType: 'TOTAL',
      })
    )
    expect(payload.discountCalculationType).toBe('TOTAL')
  })

  it('sends no discount fields for free shipping', () => {
    const payload = mapCouponFormToPayload(
      createForm({ discountType: 'FREE_SHIPPING' })
    )
    expect(payload.discountPercentage).toBeUndefined()
    expect(payload.discountAbsolute).toBeUndefined()
  })

  it('sends only the list of the selected option', () => {
    const payload = mapCouponFormToPayload(
      createForm({
        appliesTo: 'CATEGORIES',
        validFor: ['C-1'],
        segments: ['S-1'],
        includedCategories: ['shoes'],
      })
    )
    expect(payload).toMatchObject({
      allowAnonymous: true,
      categoryRestricted: true,
      segmentRestricted: false,
      restrictions: { includedCategories: ['shoes'] },
    })
    expect(payload.restrictions).toEqual({ includedCategories: ['shoes'] })
  })

  it('sends a minimum order value only when it is above zero', () => {
    expect(
      mapCouponFormToPayload(
        createForm({ minOrderValue: { amount: 0, currency: 'CHF' } })
      ).restrictions
    ).toBeUndefined()
    expect(
      mapCouponFormToPayload(
        createForm({ minOrderValue: { amount: 50, currency: null } }),
        undefined,
        'EUR'
      ).restrictions?.minOrderValue
    ).toEqual({ amount: 50, currency: 'EUR' })
  })
})

describe('mapCouponFormToPayload on edit', () => {
  it('returns the stored coupon when nothing changed', () => {
    const coupon = storedCoupon()
    expect(
      mapCouponFormToPayload(mapCouponToForm(coupon), coupon, 'USD')
    ).toEqual(coupon)
  })

  it('keeps a stored combination the form cannot express', () => {
    const coupon = storedCoupon({
      segmentRestricted: true,
      categoryRestricted: true,
      allowAnonymous: true,
      restrictions: {
        segments: ['S-1'],
        includedCategories: ['shoes'],
        validFor: ['C-9'],
      },
    } as Partial<Coupon>)
    const payload = mapCouponFormToPayload(
      formFor(coupon, { name: 'Renamed' }),
      coupon
    )
    expect(payload).toEqual({ ...coupon, name: 'Renamed' })
  })

  it('normalizes restrictions when the option changes', () => {
    const coupon = storedCoupon({
      categoryRestricted: true,
      allowAnonymous: true,
      restrictions: {
        includedCategories: ['shoes'],
        excludedCategories: ['sale'],
        minOrderValue: { amount: 50, currency: 'EUR' },
      },
    } as Partial<Coupon>)
    const payload = mapCouponFormToPayload(
      formFor(coupon, { appliesTo: 'ALL_CUSTOMERS' }),
      coupon
    )
    expect(payload).toMatchObject({
      allowAnonymous: true,
      categoryRestricted: false,
      segmentRestricted: false,
    })
    expect(payload.restrictions).toEqual({
      minOrderValue: { amount: 50, currency: 'EUR' },
    })
  })

  it('updates only the edited list of the selected option', () => {
    const coupon = storedCoupon({
      restrictions: { validFor: ['C-1'] },
    } as Partial<Coupon>)
    const payload = mapCouponFormToPayload(
      formFor(coupon, { validFor: ['C-1', 'C-2'] }),
      coupon
    )
    expect(payload.restrictions?.validFor).toEqual(['C-1', 'C-2'])
    expect(payload.allowAnonymous).toBe(false)
  })

  it('removes vendors when the vendor restriction is switched off', () => {
    const coupon = storedCoupon({
      vendorRestricted: true,
      restrictions: { vendors: ['V-1'] },
    } as Partial<Coupon>)
    const payload = mapCouponFormToPayload(
      formFor(coupon, { vendorRestricted: false }),
      coupon
    )
    expect(payload.vendorRestricted).toBe(false)
    expect(payload.restrictions).toEqual({})
  })

  it('removes the description and dates the user cleared', () => {
    const coupon = storedCoupon()
    const payload = mapCouponFormToPayload(
      formFor(coupon, { description: '  ', validFrom: null }),
      coupon
    )
    expect(payload.description).toBeUndefined()
    expect(payload.restrictions?.validFrom).toBeUndefined()
  })

  it('writes a changed date as ISO string', () => {
    const coupon = storedCoupon()
    const validUntil = new Date('2026-03-01T12:00:00Z')
    const payload = mapCouponFormToPayload(
      formFor(coupon, { validUntil }),
      coupon
    )
    expect(payload.restrictions?.validUntil).toBe('2026-03-01T12:00:00.000Z')
    expect(payload.restrictions?.validFrom).toBe('2026-01-01T10:00:00Z')
  })

  it('normalizes a legacy string percentage on save', () => {
    const coupon = storedCoupon({
      discountPercentage: '12,5' as unknown as number,
    })
    const payload = mapCouponFormToPayload(mapCouponToForm(coupon), coupon)
    expect(payload.discountPercentage).toBe(12.5)
  })

  it('switches from percent to absolute without leftover fields', () => {
    const coupon = storedCoupon()
    const payload = mapCouponFormToPayload(
      formFor(coupon, {
        discountType: 'ABSOLUTE',
        discountAbsolute: { amount: 20, currency: 'CHF' },
      }),
      coupon
    )
    expect(payload.discountPercentage).toBeUndefined()
    expect(payload.discountAbsolute).toEqual({ amount: 20, currency: 'CHF' })
    expect(payload.discountCalculationType).toBe('SUBTOTAL')
  })

  it('does not mutate the stored coupon or the form', () => {
    const overrides = {
      restrictions: { validFor: ['C-1'] },
    } as Partial<Coupon>
    const coupon = storedCoupon(overrides)
    const form = formFor(coupon, { appliesTo: 'ALL_CUSTOMERS', name: 'X' })
    mapCouponFormToPayload(form, coupon, 'EUR')
    expect(coupon).toEqual(storedCoupon(overrides))
    expect(form).toEqual(
      formFor(storedCoupon(overrides), {
        appliesTo: 'ALL_CUSTOMERS',
        name: 'X',
      })
    )
  })
})
