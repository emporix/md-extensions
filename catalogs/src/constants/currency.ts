import type { Currency } from '../models/Configuration.model'

/**
 * Active currency for the standalone shell and the no-host defaults. Inside
 * Management Dashboard the host always passes its own (`AppState.currency`).
 */
export const DEFAULT_APP_CURRENCY: Currency = {
  id: 'EUR',
  label: 'EUR',
  default: true,
  required: false,
}
