import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

export interface AgenticFeatureToggles {
  msTeams: boolean
}

const MS_TEAMS_FEATURE = 'ms-teams'

const toggleCacheKey = (appState: AppState): string =>
  `${appState.tenant}::${appState.token}`

const resolvedCache = new Map<string, AgenticFeatureToggles>()
const inFlight = new Map<string, Promise<AgenticFeatureToggles>>()

const fetchMsTeamsEnabled = async (appState: AppState): Promise<boolean> => {
  try {
    const api = new ApiClient(appState)
    const response = await api.get<FeatureToggleDto>(
      `/feature-toggle/${appState.tenant}/features/${MS_TEAMS_FEATURE}`
    )
    return response.isEnabled
  } catch (error) {
    console.error('Failed to fetch ms-teams feature toggle:', error)
    return false
  }
}

export const getAgenticFeatureToggles = async (
  appState: AppState
): Promise<AgenticFeatureToggles> => {
  const key = toggleCacheKey(appState)
  const hit = resolvedCache.get(key)
  if (hit) {
    return hit
  }

  let pending = inFlight.get(key)
  if (!pending) {
    pending = fetchMsTeamsEnabled(appState).then((msTeams) => {
      const value: AgenticFeatureToggles = { msTeams }
      resolvedCache.set(key, value)
      inFlight.delete(key)
      return value
    })
    inFlight.set(key, pending)
  }

  return pending
}

export const isMsTeamsFeatureEnabled = async (
  appState: AppState
): Promise<boolean> => {
  const { msTeams } = await getAgenticFeatureToggles(appState)
  return msTeams
}

/** Test-only: reset module cache between tests */
export const resetFeatureToggleCacheForTests = (): void => {
  resolvedCache.clear()
  inFlight.clear()
}
