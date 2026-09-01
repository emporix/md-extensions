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

describe('featureToggleService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    resetFeatureToggleCacheForTests()
  })

  it('returns true when ms-teams toggle is enabled', async () => {
    mockGet.mockImplementation((path: string) => {
      if (path.endsWith('/ms-teams')) {
        return Promise.resolve({ isEnabled: true })
      }
      return Promise.resolve({ isEnabled: false })
    })

    const result = await getAgenticFeatureToggles(appState)

    expect(mockGet).toHaveBeenCalledWith(
      '/feature-toggle/testtenant/features/ms-teams'
    )
    expect(mockGet).toHaveBeenCalledWith(
      '/feature-toggle/testtenant/features/emporixHosting'
    )
    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(result.msTeams).toBe(true)
    expect(result.emporixHosting).toBe(false)
    expect(await isMsTeamsFeatureEnabled(appState)).toBe(true)
    expect(await isEmporixHostingFeatureEnabled(appState)).toBe(false)
  })

  it('returns true when emporixHosting toggle is enabled', async () => {
    mockGet.mockImplementation((path: string) => {
      if (path.endsWith('/emporixHosting')) {
        return Promise.resolve({ isEnabled: true })
      }
      return Promise.resolve({ isEnabled: false })
    })

    const result = await getAgenticFeatureToggles(appState)

    expect(result.msTeams).toBe(false)
    expect(result.emporixHosting).toBe(true)
    expect(await isEmporixHostingFeatureEnabled(appState)).toBe(true)
  })

  it('returns false when fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('not found'))

    const result = await getAgenticFeatureToggles(appState)

    expect(result.msTeams).toBe(false)
    expect(result.emporixHosting).toBe(false)
    expect(await isMsTeamsFeatureEnabled(appState)).toBe(false)
    expect(await isEmporixHostingFeatureEnabled(appState)).toBe(false)
  })

  it('deduplicates in-flight requests for the same tenant', async () => {
    mockGet.mockResolvedValue({ isEnabled: true })

    const [first, second] = await Promise.all([
      getAgenticFeatureToggles(appState),
      getAgenticFeatureToggles(appState),
    ])

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(first).toEqual(second)
    expect(first.msTeams).toBe(true)
    expect(first.emporixHosting).toBe(true)
  })

  it('reuses cached toggles for the same tenant with a different token', async () => {
    mockGet.mockResolvedValue({ isEnabled: true })

    await getAgenticFeatureToggles(appState)
    const result = await getAgenticFeatureToggles({
      ...appState,
      token: 'rotated-token',
    })

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(result.msTeams).toBe(true)
    expect(result.emporixHosting).toBe(true)
  })
})
