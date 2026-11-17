import { describe, expect, it } from 'vitest'
import { ContactAssignment, LegalEntity } from '../models/LegalEntity.model'
import { CustomerBusinessModel } from '../models/Quotes.model'
import {
  buildQuoteCreateRequest,
  buildQuoteGeneralEditOperations,
  QuoteGeneralForm,
} from './quoteGeneralForm.helpers'

const b2bForm = (
  overrides: Partial<QuoteGeneralForm> = {}
): QuoteGeneralForm => ({
  businessModel: CustomerBusinessModel.B2B,
  company: { id: 'company-1' } as LegalEntity,
  contactPerson: { customer: { id: 'contact-1' } } as ContactAssignment,
  shippingAddressId: 'ship-1',
  billingAddressId: 'bill-1',
  sameAddresses: false,
  customer: undefined,
  restriction: 'SITE1',
  ...overrides,
})

const b2cForm = (overrides: Partial<QuoteGeneralForm> = {}): QuoteGeneralForm =>
  b2bForm({
    businessModel: CustomerBusinessModel.B2C,
    company: undefined,
    contactPerson: undefined,
    customer: { customerId: 'customer-1' } as QuoteGeneralForm['customer'],
    ...overrides,
  })

describe('buildQuoteCreateRequest', () => {
  const site = { siteCode: 'main', currency: 'EUR' }

  it('creates a B2B draft for the company and its contact on the selected site', () => {
    expect(
      buildQuoteCreateRequest(b2bForm(), { isB2B: true, ...site })
    ).toEqual({
      siteCode: 'main',
      currency: 'EUR',
      customerId: 'contact-1',
      legalEntityId: 'company-1',
      shippingAddressId: 'ship-1',
      billingAddressId: 'bill-1',
      restriction: 'SITE1',
    })
  })

  it('creates a B2C draft for the chosen customer without a company', () => {
    expect(
      buildQuoteCreateRequest(b2cForm(), { isB2B: false, ...site })
    ).toEqual({
      siteCode: 'main',
      currency: 'EUR',
      customerId: 'customer-1',
      legalEntityId: undefined,
      shippingAddressId: 'ship-1',
      billingAddressId: 'bill-1',
      restriction: 'SITE1',
    })
  })

  it('sends an empty restriction as null', () => {
    expect(
      buildQuoteCreateRequest(b2bForm({ restriction: '' }), {
        isB2B: true,
        ...site,
      }).restriction
    ).toBeNull()
    expect(
      buildQuoteCreateRequest(b2bForm({ restriction: undefined }), {
        isB2B: true,
        ...site,
      }).restriction
    ).toBeNull()
  })
})

describe('buildQuoteGeneralEditOperations', () => {
  const b2b = { isB2B: true, hasLegalEntityId: true }

  it('sends nothing for an unchanged B2B quote', () => {
    expect(buildQuoteGeneralEditOperations(b2bForm(), {}, b2b)).toEqual([])
  })

  it('replaces the company, contact and addresses that changed, in that order', () => {
    expect(
      buildQuoteGeneralEditOperations(
        b2bForm(),
        {
          company: {},
          contactPerson: {},
          billingAddressId: 'bill-1',
          shippingAddressId: 'ship-1',
        },
        b2b
      )
    ).toEqual([
      { op: 'REPLACE', path: '/legalEntityId', value: 'company-1' },
      { op: 'REPLACE', path: '/customerId', value: 'contact-1' },
      { op: 'REPLACE', path: '/billingAddressId', value: 'bill-1' },
      { op: 'REPLACE', path: '/shippingAddressId', value: 'ship-1' },
    ])
  })

  it('does not replace the company when none is selected', () => {
    expect(
      buildQuoteGeneralEditOperations(
        b2bForm({ company: undefined }),
        { company: undefined },
        b2b
      )
    ).toEqual([])
  })

  it('always drops the company link of a B2C quote', () => {
    expect(
      buildQuoteGeneralEditOperations(
        b2cForm(),
        {},
        {
          isB2B: false,
          hasLegalEntityId: true,
        }
      )
    ).toEqual([{ op: 'REMOVE', path: '/legalEntityId', value: null }])
    expect(
      buildQuoteGeneralEditOperations(
        b2cForm(),
        {},
        {
          isB2B: false,
          hasLegalEntityId: false,
        }
      )
    ).toEqual([{ op: 'REMOVE', path: '/companyName', value: null }])
  })

  it('replaces the B2C customer when it changed', () => {
    expect(
      buildQuoteGeneralEditOperations(
        b2cForm(),
        { customer: {} },
        { isB2B: false, hasLegalEntityId: false }
      )
    ).toEqual([
      { op: 'REMOVE', path: '/companyName', value: null },
      { op: 'REPLACE', path: '/customerId', value: 'customer-1' },
    ])
  })

  it('replaces a changed restriction and removes a cleared one', () => {
    expect(
      buildQuoteGeneralEditOperations(
        b2bForm({ restriction: 'SITE2' }),
        { restriction: 'SITE2' },
        b2b
      )
    ).toEqual([{ op: 'REPLACE', path: '/restriction', value: 'SITE2' }])
    expect(
      buildQuoteGeneralEditOperations(
        b2bForm({ restriction: null }),
        { restriction: null },
        b2b
      )
    ).toEqual([{ op: 'REMOVE', path: '/restriction', value: null }])
  })
})
