import Localized from './Localized.model'
import { Metadata } from './Metadata.model'

export interface Scope {
  id: string
  description: Localized
  domain: string
  metadata: Metadata
  predefined?: boolean
}

export interface AccessControl {
  id: string
  name: Localized
  description: Localized
  scopes: string[]
  domains: string[]
  metadata: Metadata
  restrictionAware: boolean
  predefined: boolean
  vendorAware?: boolean
  restrictedTo?: AccessControlRestriction
}

export enum AccessControlRestriction {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
}
