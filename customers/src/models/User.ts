import { Metadata } from './Metadata'

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROVISIONED = 'PROVISIONED',
}

export interface User {
  active: boolean
  backofficeUserNumber: string
  contactEmail: string
  department: string
  firstName: string
  id: string
  oktaID: string
  isAccountLocked: boolean
  lastName: string
  metadata?: Metadata
  status?: string
  preferredCurrency: string
  preferredLanguage: string
  preferredSite: string
  userRole: string
  validFrom: string
  groupIds?: string[]
  login: string
}

export interface UserTenants {
  oktaID: string
  tenants: string[]
}

export interface UserScopes {
  vendorId?: string
  userId: string
  scopes: string
}
