import { Metadata } from './Metadata.model'
import { Mixins } from './Mixins.model'

export enum VendorType {
  COMPANY = 'COMPANY',
  SUBSIDIARY = 'SUBSIDIARY',
}

export enum LocationType {
  HEADQUARTER = 'HEADQUARTER',
  OFFICE = 'OFFICE',
  WAREHOUSE = 'WAREHOUSE',
}

export interface Vendor {
  id: string
  name: string
  type: VendorType
  parentId: string
  legalInfo: LegalInfo
  contactDetails: VendorContact[]
  locations: Location[]
  metadata: Metadata
  mixins: Mixins
}

export interface LegalInfo {
  legalName: string
  registrationDate: string
  countryOfRegistration: string
  taxRegistrationNumber: string
}

export interface VendorContact {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Location {
  id: string
  name?: string
  type?: LocationType
  contactDetails?: LocationContactDetails
  metadata?: Metadata
  mixins?: Mixins
}

export interface LocationContactDetails {
  emails: string[]
  phones: string[]
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postcode: string
  countryCode: string
  tags: string[]
}
