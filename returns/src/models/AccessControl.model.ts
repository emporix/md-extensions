import { AccessControl } from './Permissions.model'

export type AccessControlDomainGroup = {
  name: string
  accessControls: AccessControl[]
}
