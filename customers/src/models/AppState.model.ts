import { Entry } from './Configuration.ts'
import { ResourcesDCP, ResourcesOE, RoleCode } from '../helpers/accessConfig.ts'

export type Permissions = {
  [key in ResourcesDCP | ResourcesOE]?: { [key in RoleCode]?: boolean }
}

/** User object from Management Dashboard host (shape may vary) */
export interface HostUser {
  id?: string
  email?: string
  name?: string
  [key: string]: unknown
}

export type AppState = {
  tenant: string
  language: string
  token: string
  currency: Entry | undefined
  contentLanguage: string
  permissions: Permissions
  user: HostUser
  onError: (error: unknown) => void
  /** OAuth-style scopes when MD passes them (see PermissionsProvider). */
  userScopes?: string[]
  /** Alias some hosts use instead of `userScopes`; merged into `userScopes` for consumers. */
  scopes?: string[]
}

/** `DashboardProvider` value: typed core fields plus forwarded keys from the MD host. */
export type ResolvedAppState = AppState & Record<string, unknown>
