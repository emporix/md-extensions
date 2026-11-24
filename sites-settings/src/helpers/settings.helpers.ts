import type { AppState } from '../models/AppState.model'

const TENANT_KEY = 'tenant'
const LANGUAGE_KEY = 'language'
const TOKEN_KEY = 'token'
const CONTENT_LANGUAGE_KEY = 'contentLanguage'

export const getStoredSettings = (): AppState => {
  return {
    tenant: localStorage.getItem(TENANT_KEY) ?? '',
    language: localStorage.getItem(LANGUAGE_KEY) ?? 'en',
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    contentLanguage: localStorage.getItem(CONTENT_LANGUAGE_KEY) ?? 'en',
    onError: (error: unknown) => {
      console.error(error)
    },
  }
}

export const saveStoredSettings = (settings: AppState): void => {
  localStorage.setItem(TENANT_KEY, settings.tenant)
  localStorage.setItem(LANGUAGE_KEY, settings.language)
  localStorage.setItem(TOKEN_KEY, settings.token)
  localStorage.setItem(CONTENT_LANGUAGE_KEY, settings.contentLanguage)
}

export const shouldOpenDevSettingsDialog = (): boolean => {
  const { tenant, token } = getStoredSettings()
  return tenant.trim() === '' || token.trim() === ''
}
