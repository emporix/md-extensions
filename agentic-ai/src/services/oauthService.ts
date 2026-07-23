import { OAuth } from '../types/OAuth'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import { validateOAuth } from '../utils/validation'

const getApiClient = (appState: AppState): ApiClient => new ApiClient(appState)

export const getOAuths = async (appState: AppState): Promise<OAuth[]> => {
  const api = getApiClient(appState)
  return await api.get<OAuth[]>(
    `/ai-service/${appState.tenant}/agentic/oauths`
  )
}

export const upsertOAuth = async (
  appState: AppState,
  oauth: OAuth
): Promise<OAuth> => {
  validateOAuth(oauth)
  const api = getApiClient(appState)

  const payload: Record<string, unknown> = {
    url: oauth.url,
    clientId: oauth.clientId,
    grantType: oauth.grantType,
    enabled: oauth.enabled ?? true,
    ...(oauth.scope?.trim() ? { scope: oauth.scope.trim() } : {}),
    ...(oauth.clientSecretToken?.id
      ? { clientSecretToken: { id: oauth.clientSecretToken.id } }
      : {}),
  }

  const saved = await api.put<unknown>(
    `/ai-service/${appState.tenant}/agentic/oauths/${oauth.id}`,
    payload
  )

  return saved && typeof saved === 'object' ? (saved as OAuth) : oauth
}

export const patchOAuth = async (
  appState: AppState,
  oauthId: string,
  patches: Array<{ op: string; path: string; value: unknown }>,
  force?: boolean
): Promise<void> => {
  const api = getApiClient(appState)
  const url = `/ai-service/${appState.tenant}/agentic/oauths/${oauthId}${force ? '?force=true' : ''}`
  await api.patch<void>(url, patches)
}

export const deleteOAuth = async (
  appState: AppState,
  oauthId: string,
  force?: boolean
): Promise<void> => {
  const api = getApiClient(appState)
  const url = `/ai-service/${appState.tenant}/agentic/oauths/${oauthId}${force ? '?force=true' : ''}`
  await api.delete(url)
}
