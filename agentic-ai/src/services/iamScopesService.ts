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

const myScopesCacheKey = (appState: AppState): string =>
  `${appState.tenant}\0${appState.token}`

const resolvedMyScopes = new Map<string, IamScope[]>()
const inFlightMyScopes = new Map<string, Promise<IamScope[]>>()

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

const fetchMyIamScopes = async (appState: AppState): Promise<IamScope[]> => {
  const api = getApiClient(appState)
  const response = await api.get<UserScopesResponse>(
    `/iam/${appState.tenant}/users/me/scopes`
  )
  return parseMyIamScopes(response?.scopes)
}

export const getMyIamScopes = async (
  appState: AppState
): Promise<IamScope[]> => {
  const key = myScopesCacheKey(appState)
  const hit = resolvedMyScopes.get(key)
  if (hit) {
    return hit
  }

  let pending = inFlightMyScopes.get(key)
  if (!pending) {
    pending = fetchMyIamScopes(appState).then(
      (value) => {
        resolvedMyScopes.set(key, value)
        inFlightMyScopes.delete(key)
        return value
      },
      (error: unknown) => {
        inFlightMyScopes.delete(key)
        throw error
      }
    )
    inFlightMyScopes.set(key, pending)
  }

  return pending
}

export const resetMyIamScopesCacheForTests = (): void => {
  resolvedMyScopes.clear()
  inFlightMyScopes.clear()
}
