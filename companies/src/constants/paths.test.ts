import { describe, expect, it } from 'vitest'
import {
  companiesListPath,
  companyAddPath,
  companyDetailPath,
  contactAddPath,
  contactEditPath,
  customerAssignmentAddPath,
  customerAssignmentEditPath,
  locationAddPath,
  locationEditPath,
} from './paths'

describe('paths', () => {
  it('mirrors the MD companies routes under the hash root', () => {
    expect(companiesListPath()).toBe('/')
    expect(companyAddPath()).toBe('/add')
    expect(companyDetailPath('c1')).toBe('/c1')
    expect(locationAddPath('c1')).toBe('/c1/locations')
    expect(locationEditPath('c1', 'l1')).toBe('/c1/locations/l1')
    expect(contactAddPath('c1')).toBe('/c1/assignments/contact')
    expect(contactEditPath('c1', 'a1')).toBe('/c1/assignments/contact/a1')
    expect(customerAssignmentAddPath('c1')).toBe('/c1/assignments/customer')
    expect(customerAssignmentEditPath('c1', 'a1')).toBe(
      '/c1/assignments/customer/a1'
    )
  })

  it('encodes ids and appends query strings', () => {
    expect(companyDetailPath('a/b#c')).toBe('/a%2Fb%23c')
    expect(companyDetailPath('c1', 'tab=locations')).toBe('/c1?tab=locations')
    expect(companyAddPath('?parentCompany=p1')).toBe('/add?parentCompany=p1')
    expect(
      contactAddPath('c1', new URLSearchParams({ approval: 'true' }))
    ).toBe('/c1/assignments/contact?approval=true')
    expect(locationAddPath('c1', '')).toBe('/c1/locations')
  })
})
