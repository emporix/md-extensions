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
  /**
   * Set by the Management Dashboard host: reloads the sites the dashboard
   * shell keeps (site switcher). Called after a site was created, updated,
   * had a mixin saved or was deleted. Optional, so an older host still works.
   */
  onSitesChanged?: () => void
}
