import Localized from './Localized'
import { Metadata as MixinsMetadata, Mixins } from './Order'
import { Metadata } from './Metadata.ts'

export interface LegalInfo {
  legalName: string
  registrationDate: string
  taxRegistrationNumber: string
  registrationAgency: string
  countryOfRegistration: string
  registrationId: string
}

export interface CustomerGroup {
  id: string
  name: Localized
}

export interface ApprovalGroup {
  id: string
  name?: string
  surname?: string
  customer?: Customer
  contact?: Contact
  metadata?: Metadata
}

export enum LocationType {
  HEADQUARTER = 'HEADQUARTER',
  WAREHOUSE = 'WAREHOUSE',
  OFFICE = 'OFFICE',
}

export interface Location {
  id?: string
  name: string
  type: LocationType
  contactDetails: ContactDetails
  metadata?: Metadata
}

export interface EntityAddress {
  id: string
  contactName: string
  companyName: string
  street: string
  streetNumber: string
  extraLine1?: string
  extraLine2?: string
  extraLine3?: string
  extraLine4?: string
  zipCode: string
  city: string
  state: string
  country: string
  contactPhone: string
  metadata: Metadata
  mixins: Mixins
  countryCode?: string
}

export enum CompanyType {
  SUBSIDIARY = 'SUBSIDIARY',
  COMPANY = 'COMPANY',
}

export interface AccountLimit {
  value: number
  currency: string
}

export interface LegalEntity {
  id: string
  name: string
  type: CompanyType
  parentId?: string
  accountLimit: AccountLimit
  legalInfo: LegalInfo
  customerGroups: CustomerGroup[]
  entitiesAddresses: Location[]
  documents?: { id: string }[]
  approvalGroup?: ApprovalGroup[]
  contacts?: ContactAssignment[]
  mixins?: Mixins
  metadata?: MixinsMetadata
}

export interface ContactDetails {
  emails: string[]
  displayEmail: string
  phones: string[]
  displayPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postcode: number
  countryCode: string
  tags: string[]
}

export interface Customer {
  id?: string
  name?: string
  surname?: string
  email?: string
  phone?: string
  type?: string
}

export interface Contact {
  id: string
  name: string
  surname: string
  customer: Customer
  contactDetails: ContactDetails
  metadata: Metadata
}

export interface ContactAssignment {
  id: string
  //todo: fix circular dependency when legalEntity is LegalEntity type
  legalEntity: any
  type: ContactType
  primary: boolean
  metadata?: Metadata
  customer: Customer
}

export enum ContactType {
  PRIMARY = 'PRIMARY',
  BILLING = 'BILLING',
  LOGISTICS = 'LOGISTICS',
}
