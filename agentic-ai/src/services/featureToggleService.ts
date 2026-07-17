import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

export interface AgenticFeatureToggles {
  msTeams: boolean
  aiOauth: boolean
}

const MS_TEAMS_FEATURE = 'ms-teams'
const AI_OAUTH_FEATURE = 'ai-oauth'

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
      fetchFeatureEnabled(appState, AI_OAUTH_FEATURE),
    ]).then(([msTeams, aiOauth]) => {
      const value: AgenticFeatureToggles = { msTeams, aiOauth }
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

export const isAiOauthFeatureEnabled = async (
  appState: AppState
): Promise<boolean> => {
  const { aiOauth } = await getAgenticFeatureToggles(appState)
  return aiOauth
}

/** Test-only: reset module cache between tests */
export const resetFeatureToggleCacheForTests = (): void => {
  resolvedCache.clear()
  inFlight.clear()
}
