import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppState } from '../types/common'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  ApiClient: class MockApiClient {
    get = mockGet
  },
}))

import {
  getAgenticFeatureToggles,
  isEmporixHostingFeatureEnabled,
  isMsTeamsFeatureEnabled,
  resetFeatureToggleCacheForTests,
} from './featureToggleService'

const appState: AppState = {
  tenant: 'testtenant',
  token: 'token',
  language: 'en',
  contentLanguage: 'en',
}

const LIST_PATH =
  '/feature-toggle/testtenant/features?pageNumber=1&pageSize=1000'

describe('featureToggleService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    resetFeatureToggleCacheForTests()
  })

  it('reads ms-teams from the single tenant toggle list', async () => {
    mockGet.mockResolvedValue([
      { code: 'ms-teams', isEnabled: true },
      { code: 'emporixHosting', isEnabled: false },
    ])

    const result = await getAgenticFeatureToggles(appState)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith(LIST_PATH)
    expect(result.msTeams).toBe(true)
    expect(result.emporixHosting).toBe(false)
    expect(result.aiAgentChat).toBe(false)
    expect(await isMsTeamsFeatureEnabled(appState)).toBe(true)
    expect(await isEmporixHostingFeatureEnabled(appState)).toBe(false)
  })

  it('reads toggles from the paginated values list', async () => {
    mockGet.mockResolvedValue({
      values: [
        { code: 'ms-teams', isEnabled: true },
        { code: 'ai-agent-chat', isEnabled: true },
      ],
      totalRecords: 2,
    })

    const result = await getAgenticFeatureToggles(appState)

    expect(result.msTeams).toBe(true)
    expect(result.emporixHosting).toBe(false)
    expect(result.aiAgentChat).toBe(true)
  })

  it('reads emporixHosting and ai-agent-chat from the same list', async () => {
    mockGet.mockResolvedValue([
      { code: 'emporixHosting', isEnabled: true },
      { code: 'ai-agent-chat', isEnabled: true },
    ])

    const result = await getAgenticFeatureToggles(appState)

    expect(result.msTeams).toBe(false)
    expect(result.emporixHosting).toBe(true)
    expect(result.aiAgentChat).toBe(true)
    expect(await isEmporixHostingFeatureEnabled(appState)).toBe(true)
  })

  it('returns false when fetch fails and retries the next call', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'))
    mockGet.mockResolvedValueOnce([{ code: 'ai-agent-chat', isEnabled: true }])

    const failed = await getAgenticFeatureToggles(appState)

    expect(failed.msTeams).toBe(false)
    expect(failed.emporixHosting).toBe(false)
    expect(failed.aiAgentChat).toBe(false)

    const retried = await getAgenticFeatureToggles(appState)

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(retried.aiAgentChat).toBe(true)
  })

  it('deduplicates in-flight requests for the same tenant', async () => {
    mockGet.mockResolvedValue([
      { code: 'ms-teams', isEnabled: true },
      { code: 'emporixHosting', isEnabled: true },
      { code: 'ai-agent-chat', isEnabled: true },
    ])

    const [first, second] = await Promise.all([
      getAgenticFeatureToggles(appState),
      getAgenticFeatureToggles(appState),
    ])

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
    expect(first.msTeams).toBe(true)
    expect(first.emporixHosting).toBe(true)
    expect(first.aiAgentChat).toBe(true)
  })

  it('reuses cached toggles for the same tenant with a different token', async () => {
    mockGet.mockResolvedValue([
      { code: 'ms-teams', isEnabled: true },
      { code: 'emporixHosting', isEnabled: true },
      { code: 'ai-agent-chat', isEnabled: true },
    ])

    await getAgenticFeatureToggles(appState)
    const result = await getAgenticFeatureToggles({
      ...appState,
      token: 'rotated-token',
    })

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(result.msTeams).toBe(true)
    expect(result.emporixHosting).toBe(true)
    expect(result.aiAgentChat).toBe(true)
  })
})
