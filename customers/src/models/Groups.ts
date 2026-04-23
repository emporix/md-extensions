import Localized from './Localized'
import { Metadata } from './Metadata'
import { RoleCode } from '../helpers/accessConfig'

export enum GroupUserTypes {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface Group {
  id: string
  code: string
  name: Localized
  b2b?: {
    legalEntityId: string | null
  }
  description: Localized
  accessControls: string[]
  templates: string[]
  metadata: Metadata
  userType: GroupUserTypes
  mixins?: []
}

export interface GroupUser {
  id: string
  groupId: string
  userId: string
  userType: string
}

export interface Permission {
  id: string
  applicablePermissionResources?: string[]
}

export interface Role {
  id: string
  code: string
  name: Localized
  description: Localized
  permissions: Permission[]
}

export interface Resource {
  id: string
  name: Localized
  description: Localized
  code: string
}

export interface AccessControl {
  name: Localized
  id: string
  scopes: string[]
  roleId: string
  resourceId: string
  role: Role
  resource: Resource
  metadata: Metadata
  optionName?: string
}

export interface Template {
  id: string
  name: Localized
  optionName?: string
  accessControls: string[]
  accessControlsDocuments: AccessControl[]
  description: Localized
  tags: RoleCode[]
}
