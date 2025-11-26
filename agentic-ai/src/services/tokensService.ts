import { Token } from '../types/Token'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import { validateToken } from '../utils/validation'

const getApiClient = (appState: AppState): ApiClient => {
  return new ApiClient(appState)
}

export const getTokens = async (appState: AppState): Promise<Token[]> => {
  const api = getApiClient(appState)
  return await api.get<Token[]>(`/ai-service/${appState.tenant}/agentic/tokens`)
}

export const upsertToken = async (
  appState: AppState,
  token: Token
): Promise<Token> => {
  validateToken(token)
  const api = getApiClient(appState)

  return await api.put<Token>(
    `/ai-service/${appState.tenant}/agentic/tokens/${token.id}`,
    {
      name: token.name,
      value: token.value,
    }
  )
}

export const deleteToken = async (
  appState: AppState,
  tokenId: string,
  force?: boolean
): Promise<void> => {
  const api = getApiClient(appState)
  const url = `/ai-service/${appState.tenant}/agentic/tokens/${tokenId}${force ? '?force=true' : ''}`
  await api.delete(url)
}
