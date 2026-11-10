import { describe, expect, it } from 'vitest'
import { Location, LocationType } from '../models/LegalEntity.model'
import {
  createLocationForm,
  mapLocationFormToPayload,
  mapLocationToLocationForm,
} from './locationForm.helpers'

const location = {
  id: 'loc-1',
  name: 'Main office',
  type: LocationType.OFFICE,
  contactDetails: {
    emails: ['office@example.com'],
    displayEmail: 'office@example.com',
    phones: [],
    displayPhone: '',
    addressLine1: 'Street 1',
    addressLine2: 'Floor 2',
    city: 'Berlin',
    state: 'BE',
    postcode: 10115,
    countryCode: 'DE',
    tags: ['north'],
  },
  mixins: { info: { a: 1 } },
  metadata: { version: 3, mixins: { info: 'https://schema/info.json' } },
} as unknown as Location

describe('locationForm helpers', () => {
  it('creates an empty headquarter form', () => {
    expect(createLocationForm()).toEqual({
      id: '',
      type: LocationType.HEADQUARTER,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      tags: [],
    })
  })

  it('maps a location to the form, postcode as text', () => {
    expect(mapLocationToLocationForm(location)).toEqual({
      id: 'loc-1',
      type: LocationType.OFFICE,
      name: 'Main office',
      addressLine1: 'Street 1',
      addressLine2: 'Floor 2',
      city: 'Berlin',
      state: 'BE',
      postcode: '10115',
      country: 'DE',
      tags: ['north'],
    })
  })

  it('falls back to defaults for a location without details', () => {
    const form = mapLocationToLocationForm({} as Location)
    expect(form).toEqual(createLocationForm())
  })

  it('maps the form to a create payload without an empty id', () => {
    const payload = mapLocationFormToPayload({
      ...createLocationForm(),
      name: 'Warehouse',
      type: LocationType.WAREHOUSE,
      postcode: '12345',
      country: 'PL',
      tags: ['a', 'b'],
    })
    expect(payload).not.toHaveProperty('id')
    expect(payload).toEqual({
      name: 'Warehouse',
      type: LocationType.WAREHOUSE,
      contactDetails: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postcode: 12345,
        countryCode: 'PL',
        tags: ['a', 'b'],
      },
    })
  })

  it('sends a user-provided id on create', () => {
    const payload = mapLocationFormToPayload({
      ...createLocationForm(),
      id: 'custom-id',
    })
    expect(payload.id).toBe('custom-id')
  })

  it('drops an empty or non-numeric postcode', () => {
    expect(
      mapLocationFormToPayload({ ...createLocationForm(), postcode: '' })
        .contactDetails?.postcode
    ).toBeUndefined()
    expect(
      mapLocationFormToPayload({ ...createLocationForm(), postcode: 'AB-1' })
        .contactDetails?.postcode
    ).toBeUndefined()
  })

  it('keeps the existing location fields on update', () => {
    const form = {
      ...mapLocationToLocationForm(location),
      name: 'Renamed',
      tags: [],
    }
    const payload = mapLocationFormToPayload(form, location)
    expect(payload.mixins).toEqual(location.mixins)
    expect(payload.metadata).toEqual(location.metadata)
    expect(payload.name).toBe('Renamed')
    expect(payload.contactDetails?.emails).toEqual(['office@example.com'])
    expect(payload.contactDetails?.tags).toEqual([])
    expect(payload.contactDetails?.postcode).toBe(10115)
  })
})
