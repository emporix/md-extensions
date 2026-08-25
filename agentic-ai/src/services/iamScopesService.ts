import { AppState } from '../types/common'
import { buildQueryParams } from '../utils/apiHelpers'
import { ApiClient } from './apiClient'

export interface IamScope {
  id: string
  description?: Record<string, string>
  domain?: string
  predefined?: boolean
}

const getApiClient = (appState: AppState): ApiClient => new ApiClient(appState)

export const getIamScopes = async (appState: AppState): Promise<IamScope[]> => {
  const api = getApiClient(appState)
  const query = buildQueryParams({ pageNumber: 1, pageSize: 1000 })
  const scopes = await api.get<IamScope[]>(`/iam/${appState.tenant}/scopes${query}`)
  return (scopes ?? []).filter((scope) => !!scope.id?.trim())
}
