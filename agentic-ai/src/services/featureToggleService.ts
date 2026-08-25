import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

export interface AgenticFeatureToggles {
  msTeams: boolean
  emporixHosting: boolean
}

const MS_TEAMS_FEATURE = 'ms-teams'
const EMPORIX_HOSTING_FEATURE = 'emporixHosting'

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
    pending = Promise.all([
      fetchFeatureEnabled(appState, MS_TEAMS_FEATURE),
      fetchFeatureEnabled(appState, EMPORIX_HOSTING_FEATURE),
    ]).then(([msTeams, emporixHosting]) => {
      const value: AgenticFeatureToggles = { msTeams, emporixHosting }
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

export const isEmporixHostingFeatureEnabled = async (
  appState: AppState
): Promise<boolean> => {
  const { emporixHosting } = await getAgenticFeatureToggles(appState)
  return emporixHosting
}

/** Test-only: reset module cache between tests */
export const resetFeatureToggleCacheForTests = (): void => {
  resolvedCache.clear()
  inFlight.clear()
}
