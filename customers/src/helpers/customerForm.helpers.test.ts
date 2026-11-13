import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CUSTOMER,
  buildAssistedBuyingUrl,
  generateRandomPassword,
  getAssistedBuyingSites,
  getRestrictionOptions,
  getSiteOptions,
  toCustomerPayload,
  withMixinContainers,
} from './customerForm.helpers'
import type { Site } from '../models/Site.model'

const site = (code: string, storefrontUrl = '') =>
  ({
    code,
    name: code.toUpperCase(),
    assistedBuying: { storefrontUrl },
  }) as Site

describe('customerForm.helpers', () => {
  it('generates a 12-character password from the MD charset', () => {
    const password = generateRandomPassword()
    expect(password).toHaveLength(12)
    expect(password).toMatch(/^[a-zA-Z0-9!@#$%^&*]{12}$/)
    expect(generateRandomPassword(() => 0)).toBe('aaaaaaaaaaaa')
  })

  it('sends an empty restriction as null and leaves out an empty password', () => {
    const payload = toCustomerPayload({
      ...DEFAULT_CUSTOMER,
      restriction: '',
      password: '',
    })
    expect(payload.restriction).toBeNull()
    expect(payload.password).toBeUndefined()
    expect(
      toCustomerPayload({ ...DEFAULT_CUSTOMER, password: 'secret' }).password
    ).toBe('secret')
  })

  it('adds missing mixin containers', () => {
    const customer = withMixinContainers({
      ...DEFAULT_CUSTOMER,
      mixins: undefined,
      metadata: { version: 2 },
    })
    expect(customer.mixins).toEqual({})
    expect(customer.metadata).toEqual({ version: 2, mixins: {} })
  })

  it('limits sites only when restrictions are synced and the user is restricted', () => {
    const sites = [site('main'), site('outlet')]
    expect(getSiteOptions(sites, false, ['main'])).toHaveLength(2)
    expect(getSiteOptions(sites, true, null)).toHaveLength(2)
    expect(getSiteOptions(sites, true, ['main'])).toEqual([
      { label: 'MAIN - main', value: 'main' },
    ])
  })

  it('offers the configured restrictions the user may assign', () => {
    expect(getRestrictionOptions(['a', 'b'], null)).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ])
    expect(getRestrictionOptions(['a', 'b'], ['b'])).toEqual([
      { label: 'b', value: 'b' },
    ])
    expect(getRestrictionOptions(undefined, null)).toEqual([])
  })

  it('keeps sites with an assisted-buying storefront', () => {
    expect(
      getAssistedBuyingSites([site('a', 'https://a'), site('b')]).map(
        (s) => s.code
      )
    ).toEqual(['a'])
  })

  it('adds the login tokens to the storefront URL', () => {
    const url = new URL(
      buildAssistedBuyingUrl('https://shop.example.com/?lang=de', {
        accessToken: 'at',
        expiresIn: 1,
        refreshToken: 'rt',
        refreshTokenExpiresIn: 2,
        saasToken: 'st',
      })
    )
    expect(Object.fromEntries(url.searchParams)).toEqual({
      lang: 'de',
      customerToken: 'at',
      customerTokenExpiresIn: '1',
      refreshToken: 'rt',
      refreshTokenExpiresIn: '2',
      saasToken: 'st',
    })
  })
})
