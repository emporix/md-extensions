import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

export interface AgenticFeatureToggles {
  msTeams: boolean
}

const MS_TEAMS_FEATURE = 'ms-teams'

const toggleCacheKey = (appState: AppState): string => appState.tenant

const resolvedCache = new Map<string, AgenticFeatureToggles>()
const inFlight = new Map<string, Promise<AgenticFeatureToggles>>()

const fetchFeatureEnabled = async (
  appState: AppState,
  feature: string
): Promise<boolean> => {
  try {
    const api = new ApiClient(appState)
    const response = await api.get<FeatureToggleDto>(
      `/feature-toggle/${appState.tenant}/features/${feature}`
    )
    return response.isEnabled
  } catch (error) {
    console.error(`Failed to fetch ${feature} feature toggle:`, error)
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
    pending = fetchFeatureEnabled(appState, MS_TEAMS_FEATURE).then(
      (msTeams) => {
        const value: AgenticFeatureToggles = { msTeams }
        resolvedCache.set(key, value)
        inFlight.delete(key)
        return value
      }
    )
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
