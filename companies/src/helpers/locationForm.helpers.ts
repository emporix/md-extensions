import {
  ContactDetails,
  Location,
  LocationType,
} from '../models/LegalEntity.model'

export interface LocationForm {
  id: string
  type: LocationType
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postcode: string
  country: string
  tags: string[]
}

export const createLocationForm = (): LocationForm => ({
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

export const mapLocationToLocationForm = (
  location: Location
): LocationForm => ({
  id: location.id ?? '',
  type: location.type ?? LocationType.HEADQUARTER,
  name: location.name ?? '',
  addressLine1: location.contactDetails?.addressLine1 ?? '',
  addressLine2: location.contactDetails?.addressLine2 ?? '',
  city: location.contactDetails?.city ?? '',
  state: location.contactDetails?.state ?? '',
  postcode:
    location.contactDetails?.postcode != null
      ? String(location.contactDetails.postcode)
      : '',
  country: location.contactDetails?.countryCode ?? '',
  tags: location.contactDetails?.tags ?? [],
})

export const mapLocationFormToPayload = (
  form: LocationForm,
  location?: Location
): Partial<Location> => {
  const parsedPostcode = Number(form.postcode)
  const postcode =
    form.postcode === '' || Number.isNaN(parsedPostcode)
      ? undefined
      : parsedPostcode

  return {
    ...location,
    // Only send an id the user actually provided (id is editable on create);
    // an empty id would post `id: ''` instead of letting the backend generate one.
    ...(form.id ? { id: form.id } : {}),
    name: form.name,
    type: form.type,
    contactDetails: {
      ...location?.contactDetails,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city,
      state: form.state,
      postcode,
      countryCode: form.country,
      tags: form.tags,
    } as ContactDetails,
  }
}
