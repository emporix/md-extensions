import Localized from './Localized.model'
import { Metadata } from './Metadata.model'
import { AccessControl } from './Permissions.model'

export enum GroupUserTypes {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum RoleCode {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  MANAGER = 'manager',
  ADMINISTRATOR = 'administrator',
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
  vendorId?: string
  mixins?: []
  restrictions?: string[] | null
}

export interface GroupUser {
  id: string
  groupId: string
  userId: string
  userType: string
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
