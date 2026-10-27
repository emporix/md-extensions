import type { Currency } from './Configuration.model'
import type { SessionUser } from './SessionUser.model'

export type AppState = {
  tenant: string
  language: string
  token: string
  currency?: Currency
  contentLanguage: string
  user?: SessionUser
  onError: (error: unknown) => void
}
