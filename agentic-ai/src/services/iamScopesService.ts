import { AppState } from '../types/common'
import { buildQueryParams } from '../utils/apiHelpers'
import { ApiClient } from './apiClient'

export interface IamScope {
  id: string
  description?: Record<string, string>
  domain?: string
  predefined?: boolean
}

export interface UserScopesResponse {
  userId?: string
  scopes?: string
  vendorId?: string
}

const getApiClient = (appState: AppState): ApiClient => new ApiClient(appState)

export const parseMyIamScopes = (
  scopes: string | undefined | null
): IamScope[] => {
  if (!scopes?.trim()) {
    return []
  }

  const ids = [
    ...new Set(
      scopes
        .split(/\s+/)
        .map((id) => id.trim())
        .filter((id) => id && !id.startsWith('tenant='))
    ),
  ].sort((a, b) => a.localeCompare(b))

  return ids.map((id) => ({ id }))
}

export const getIamScopes = async (appState: AppState): Promise<IamScope[]> => {
  const api = getApiClient(appState)
  const query = buildQueryParams({ pageNumber: 1, pageSize: 1000 })
  const scopes = await api.get<IamScope[]>(
    `/iam/${appState.tenant}/scopes${query}`
  )
  return (scopes ?? []).filter((scope) => !!scope.id?.trim())
}

export const getMyIamScopes = async (
  appState: AppState
): Promise<IamScope[]> => {
  const api = getApiClient(appState)
  const response = await api.get<UserScopesResponse>(
    `/iam/${appState.tenant}/users/me/scopes`
  )
  return parseMyIamScopes(response?.scopes)
}
