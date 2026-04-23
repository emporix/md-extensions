import { LegalEntity } from './LegalEntity'
import { Metadata } from './Metadata'
import { Mixins } from './Mixins'

export interface CustomerAddress {
  id?: string | undefined
  contactName: string
  companyName: string
  street: string
  streetNumber: string
  streetAppendix: string
  zipCode: string
  city: string
  country: string
  isDefault: boolean
  tags: string[]
  contactPhone: string
  state: string
  metadata: Metadata
  mixins: Mixins
}

export const DEFAULT_ADDRESS: CustomerAddress = {
  contactName: '',
  companyName: '',
  street: '',
  streetNumber: '',
  streetAppendix: '',
  zipCode: '',
  city: '',
  country: '',
  isDefault: false,
  contactPhone: '',
  tags: [],
  state: '',
  mixins: {},
  metadata: {},
}

interface CustomerB2bData {
  companyRegistrationId: string | null
  legalEntities: LegalEntity[]
}

export enum CustomerBusinessModel {
  B2B = 'B2B',
  B2C = 'B2C',
}

export interface Customer {
  masterUserId?: string
  id?: string | undefined
  customerNumber: string
  firstName: string
  lastName: string
  active: boolean
  company?: string
  contactEmail: string
  contactPhone: string
  password?: string
  b2b: CustomerB2bData
  businessModel: CustomerBusinessModel
  onHold: boolean
  preferredCurrency?: string
  preferredLanguage?: string
  preferredSite?: string
  title: string
  type?: string
  addresses: CustomerAddress[]
  customerGroup?: string
  metadata: Metadata
  mixins?: Mixins
  metadataCreatedAt?: string
  lastLogin?: string
  restriction?: string | null
}
