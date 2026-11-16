import { describe, expect, it } from 'vitest'
import {
  HOST_COMPANY_PATH,
  HOST_CUSTOMER_GROUP_PATH,
  customerAddPath,
  customerDetailPath,
  customersListPath,
} from './paths'

describe('paths', () => {
  it('mirrors the MD customers routes under the hash root', () => {
    expect(customersListPath()).toBe('/')
    expect(customerAddPath()).toBe('/add')
    expect(customerDetailPath('c1')).toBe('/c1')
  })

  it('keeps ids with reserved characters in one segment', () => {
    expect(customerDetailPath('a/b#c')).toBe('/a%2Fb%23c')
    expect(customerDetailPath('c1', 'tab=1')).toBe('/c1?tab=1')
  })

  it('builds host links for companies and customer groups', () => {
    expect(HOST_COMPANY_PATH('le 1', 'c#1')).toBe(
      '/apps/management/companies#/le%201?customerId=c%231'
    )
    expect(HOST_COMPANY_PATH('le1')).toBe('/apps/management/companies#/le1')
    expect(HOST_CUSTOMER_GROUP_PATH('g1')).toBe(
      '/administration/customer-groups#/groups/g1'
    )
  })
})
