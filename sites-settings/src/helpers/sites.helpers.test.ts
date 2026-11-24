import { describe, expect, it } from 'vitest'
import {
  createForm,
  isValidCartCalculationScale,
  keepDefaultLanguage,
  mapToForm,
  mapToPayload,
  mapToUpdatePayload,
  parseCartCalculationScale,
  toSitePayments,
} from './sites.helpers'
import type { Site } from '../models/Site.model'

const site: Site = {
  code: 'main',
  name: 'Main',
  active: true,
  default: true,
  defaultLanguage: 'en',
  languages: ['en', 'de'],
  currency: 'EUR',
  availableCurrencies: ['EUR', 'USD'],
  shipToCountries: ['DE'],
  payment: [{ id: 'p1', name: 'INVOICE', active: true }],
  taxDeterminationBasedOn: 'SHIPPING_ADDRESS',
  cartCalculationScale: 4,
  assistedBuying: { storefrontUrl: 'https://shop' },
  homeBase: {
    address: {
      city: 'Berlin',
      country: 'DE',
      zipCode: '10115',
      street: 'Unter den Linden',
      streetNumber: '1',
      state: 'BE',
    },
    location: { latitude: 52.5, longitude: 13.4 },
    timezone: 'Europe/Berlin',
  },
  mixins: { general: { logo: 'x' } },
  metadata: { version: 3, mixins: { general: 'https://schema' } },
}

describe('site form mapping', () => {
  it('maps a site to the form and back without losing a field', () => {
    const payload = mapToPayload(mapToForm(site))
    expect(payload).toEqual({
      code: 'main',
      name: 'Main',
      active: true,
      default: true,
      defaultLanguage: 'en',
      languages: ['en', 'de'],
      currency: 'EUR',
      availableCurrencies: ['EUR', 'USD'],
      shipToCountries: ['DE'],
      payment: site.payment,
      taxDeterminationBasedOn: 'SHIPPING_ADDRESS',
      cartCalculationScale: 4,
      assistedBuying: { storefrontUrl: 'https://shop' },
      homeBase: site.homeBase,
    })
  })

  it('fills the MD defaults for a new site and for missing fields', () => {
    expect(createForm()).toMatchObject({
      active: true,
      default: false,
      taxDeterminationBasedOn: 'BILLING_ADDRESS',
      cartCalculationScale: 2,
    })
    const form = mapToForm({
      code: 'x',
      name: 'X',
      defaultLanguage: 'en',
      languages: ['en'],
      currency: 'EUR',
      shipToCountries: [],
      homeBase: { address: { country: 'DE', zipCode: '' } },
    })
    expect(form).toMatchObject({
      active: false,
      taxDeterminationBasedOn: 'BILLING_ADDRESS',
      cartCalculationScale: 2,
      storefrontUrl: '',
      timezone: '',
      payment: [],
    })
  })

  it('keeps mixins and metadata of the loaded site on an edit (Scenario 4)', () => {
    const form = { ...mapToForm(site), name: 'Renamed' }
    const body = mapToUpdatePayload(site, form)
    expect(body.name).toBe('Renamed')
    expect(body.mixins).toEqual(site.mixins)
    expect(body.metadata).toEqual(site.metadata)
  })
})

describe('Scenario 9: form rules', () => {
  it('accepts only integers ≥ 0 as decimal digits, empty allowed', () => {
    expect(isValidCartCalculationScale(0)).toBe(true)
    expect(isValidCartCalculationScale(3)).toBe(true)
    expect(isValidCartCalculationScale(undefined)).toBe(true)
    expect(isValidCartCalculationScale(1.5)).toBe(false)
    expect(isValidCartCalculationScale(-1)).toBe(false)
  })

  it('turns an empty input into 2 and a negative one into 0', () => {
    expect(parseCartCalculationScale('')).toBe(2)
    expect(parseCartCalculationScale('-3')).toBe(0)
    expect(parseCartCalculationScale('5')).toBe(5)
  })

  it('clears the default language once it is no site language', () => {
    expect(keepDefaultLanguage(['en', 'de'], 'de')).toBe('de')
    expect(keepDefaultLanguage(['en'], 'de')).toBe('')
  })
})

describe('payment methods', () => {
  const offered = [
    { id: 'p1', name: 'INVOICE' },
    { id: 'p2', name: 'CARD' },
  ]

  it('maps the picked ids to the offered entries', () => {
    expect(toSitePayments(['p2'], [], offered)).toEqual([offered[1]])
  })

  it('keeps a payment the gateway no longer offers', () => {
    const legacy = { id: 'old', name: 'LEGACY' }
    expect(toSitePayments(['p1'], [legacy, offered[1]], offered)).toEqual([
      legacy,
      offered[0],
    ])
  })
})
