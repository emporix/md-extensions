import { describe, expect, it } from 'vitest'
import {
  getOwningSiteMode,
  getSiteOptions,
  toContactCustomerPayload,
} from './owningSite.helpers'
import { CustomerBusinessModel, type Customer } from '../models/Customer.model'
import type { Site } from '../models/Site.model'

const site = (code: string) => ({ code, name: code.toUpperCase() }) as Site

const contact: Customer = {
  customerNumber: '',
  firstName: 'Ann',
  lastName: 'Lee',
  businessModel: CustomerBusinessModel.B2B,
  b2b: { legalEntities: [], companyRegistrationId: null },
  active: false,
  contactEmail: 'ann@example.com',
  contactPhone: '',
  onHold: false,
  title: 'MR',
  metadata: {},
  addresses: [],
}

describe('owningSite.helpers', () => {
  it('requires an owning site on create only when the account scope is SITE', () => {
    expect(getOwningSiteMode('SITE', true)).toBe('required')
    expect(getOwningSiteMode('SITE', false)).toBe('readOnly')
  })

  it.each([['TENANT'], [undefined], [null], [''], ['site']])(
    'hides the owning site when the account scope is %j',
    (scope) => {
      expect(getOwningSiteMode(scope, true)).toBe('hidden')
      expect(getOwningSiteMode(scope, false)).toBe('hidden')
    }
  )

  it('limits owning sites only when restrictions are synced and the user is restricted', () => {
    const sites = [site('main'), site('outlet')]
    expect(getSiteOptions(sites, false, ['main'])).toHaveLength(2)
    expect(getSiteOptions(sites, true, null)).toHaveLength(2)
    expect(getSiteOptions(sites, true, ['main'])).toEqual([
      { label: 'MAIN - main', value: 'main' },
    ])
  })

  it('sends the owning site only on a create that requires it', () => {
    const withSite = { ...contact, siteCode: 'outlet' }
    expect(toContactCustomerPayload(withSite, 'required').siteCode).toBe(
      'outlet'
    )
    expect(toContactCustomerPayload(withSite, 'hidden')).not.toHaveProperty(
      'siteCode'
    )
    expect(
      toContactCustomerPayload({ ...contact, siteCode: '' }, 'required')
    ).not.toHaveProperty('siteCode')
  })
})
