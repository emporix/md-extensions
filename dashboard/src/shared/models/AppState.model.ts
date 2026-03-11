/**
 * Application State Model
 *
 * Represents the core application state containing tenant, language, and authentication token
 */

export type SystemPreferencesPermissions = {
  manager?: boolean
}

export type AppStatePermissions = {
  systemPreferences?: SystemPreferencesPermissions
}

/**
 * Application state configuration (injected by the host application)
 */
export type AppState = {
  /** Tenant identifier for multi-tenant support */
  tenant: string
  language: string
  token: string
  currency: Entry
  contentLanguage: string
  user: User
  /** Optional permissions (e.g. systemPreferences.manager for saving global config) */
  permissions?: AppStatePermissions
}

export interface Entry {
  id: string
  label: string
  default: boolean
  required: boolean
}

export interface User {
  userId: string
  firstName?: string
  lastName?: string
  email?: string
  termsAndConditions: boolean
}
