import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleValue {
  code: string
  isEnabled: boolean
}

export interface AgenticFeatureToggles {
  msTeams: boolean
  emporixHosting: boolean
  aiAgentChat: boolean
}

const MS_TEAMS_FEATURE = 'ms-teams'
const EMPORIX_HOSTING_FEATURE = 'emporixHosting'
const AI_AGENT_CHAT_FEATURE = 'ai-agent-chat'
const FEATURE_TOGGLE_PAGE_SIZE = 1000

const toggleCacheKey = (appState: AppState): string => appState.tenant

const resolvedCache = new Map<string, FeatureToggleValue[]>()
const inFlight = new Map<string, Promise<FeatureToggleValue[]>>()

const featureToggleListPath = (tenant: string): string =>
  `/feature-toggle/${tenant}/features?pageNumber=1&pageSize=${FEATURE_TOGGLE_PAGE_SIZE}`

const isCodeEnabled = (values: FeatureToggleValue[], code: string): boolean =>
  values.some((entry) => entry.code === code && entry.isEnabled === true)

export const toAgenticToggles = (
  values: FeatureToggleValue[]
): AgenticFeatureToggles => ({
  msTeams: isCodeEnabled(values, MS_TEAMS_FEATURE),
  emporixHosting: isCodeEnabled(values, EMPORIX_HOSTING_FEATURE),
  aiAgentChat: isCodeEnabled(values, AI_AGENT_CHAT_FEATURE),
})

const readFeatureToggleValues = (response: unknown): FeatureToggleValue[] => {
  if (Array.isArray(response)) {
    return response
  }
  if (!response || typeof response !== 'object') {
    return []
  }
  const values = (response as { values?: unknown }).values
  return Array.isArray(values) ? values : []
}

const fetchFeatureToggleValues = async (
  appState: AppState
): Promise<FeatureToggleValue[]> => {
  const api = new ApiClient(appState)
  const response = await api.get<unknown>(
    featureToggleListPath(appState.tenant)
  )
  return readFeatureToggleValues(response)
}

export const getFeatureToggleValues = async (
  appState: AppState
): Promise<FeatureToggleValue[]> => {
  const key = toggleCacheKey(appState)
  const hit = resolvedCache.get(key)
  if (hit) {
    return hit
  }

  let pending = inFlight.get(key)
  if (!pending) {
    pending = fetchFeatureToggleValues(appState).then(
      (value) => {
        resolvedCache.set(key, value)
        inFlight.delete(key)
        return value
      },
      (error: unknown) => {
        console.error('Failed to fetch feature toggles:', error)
        inFlight.delete(key)
        return []
      }
    )
    inFlight.set(key, pending)
  }

  return pending
}

export const getAgenticFeatureToggles = async (
  appState: AppState
): Promise<AgenticFeatureToggles> =>
  toAgenticToggles(await getFeatureToggleValues(appState))

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
