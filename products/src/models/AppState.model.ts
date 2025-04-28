import { Entry } from './Configuration.ts'
import { ResourcesDCP, ResourcesOE, RoleCode } from '../helpers/accessConfig.ts'

export type Permissions = {
  [key in ResourcesDCP | ResourcesOE]?: { [key in RoleCode]?: boolean }
}

export type AppState = {
  tenant: string
  language: string
  token: string
  currency: Entry | undefined
  contentLanguage: string
  permissions: Permissions
  onError: (originalRequest: any, error: any) => void
}
