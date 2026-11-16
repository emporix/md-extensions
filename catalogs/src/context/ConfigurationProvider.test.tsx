/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { fetchBasicConfiguration } from '@emporix/api-calls'
import { DashboardProvider } from './Dashboard.context'
import {
  ConfigurationProvider,
  useConfiguration,
} from './ConfigurationProvider'
import type { AppState } from '../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../constants/currency'

/** One pending configuration request per tenant, resolved in any order. */
const pending = vi.hoisted(() => {
  const resolvers = new Map<string, (value: unknown) => void>()
  return {
    request: (tenant: string) =>
      new Promise((resolve) => resolvers.set(tenant, resolve)),
    resolve: (tenant: string, value: unknown) => resolvers.get(tenant)?.(value),
    clear: () => resolvers.clear(),
  }
})

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return { ...actual, fetchBasicConfiguration: vi.fn() }
})

const appState = (tenant: string, contentLanguage = 'en'): AppState => ({
  tenant,
  language: 'en',
  token: 'token',
  contentLanguage,
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
})

const renderForTenant = (tenant: string, tree: ReactNode) => {
  const result = render(
    <DashboardProvider appState={appState(tenant)}>{tree}</DashboardProvider>
  )
  return (next: string) =>
    result.rerender(
      <DashboardProvider appState={appState(next)}>{tree}</DashboardProvider>
    )
}

const Languages = () => (
  <span data-testid="languages">
    {useConfiguration()
      .languages.map((language) => language.id)
      .join(',') || 'none'}
  </span>
)

describe('ConfigurationProvider on a host tenant switch', () => {
  afterEach(() => {
    cleanup()
    pending.clear()
    vi.mocked(fetchBasicConfiguration).mockReset()
  })

  it('keeps the new tenant configuration when the old response arrives late', async () => {
    vi.mocked(fetchBasicConfiguration).mockImplementation(
      (tenant: string) =>
        pending.request(tenant) as ReturnType<typeof fetchBasicConfiguration>
    )
    const switchTenant = renderForTenant(
      'a',
      <ConfigurationProvider>
        <Languages />
      </ConfigurationProvider>
    )

    switchTenant('b')
    await act(async () => pending.resolve('b', { languages: [{ id: 'de' }] }))
    await act(async () => pending.resolve('a', { languages: [{ id: 'en' }] }))

    expect(screen.getByTestId('languages').textContent).toBe('de')
  })

  it('drops the previous tenant configuration while the new one loads', async () => {
    vi.mocked(fetchBasicConfiguration).mockImplementation(
      (tenant: string) =>
        pending.request(tenant) as ReturnType<typeof fetchBasicConfiguration>
    )
    const switchTenant = renderForTenant(
      'a',
      <ConfigurationProvider>
        <Languages />
      </ConfigurationProvider>
    )
    await act(async () => pending.resolve('a', { languages: [{ id: 'en' }] }))
    expect(screen.getByTestId('languages').textContent).toBe('en')

    await act(async () => switchTenant('b'))

    expect(screen.getByTestId('languages').textContent).toBe('none')
  })

  it('keeps the newest response when two requests for one tenant overlap', async () => {
    let call = 0
    vi.mocked(fetchBasicConfiguration).mockImplementation(
      () =>
        pending.request(`request-${++call}`) as ReturnType<
          typeof fetchBasicConfiguration
        >
    )
    const tree = (
      <ConfigurationProvider>
        <Languages />
      </ConfigurationProvider>
    )
    const { rerender } = render(
      <DashboardProvider appState={appState('a')}>{tree}</DashboardProvider>
    )

    // A content-language change reloads the configuration of the same tenant.
    rerender(
      <DashboardProvider appState={appState('a', 'de')}>
        {tree}
      </DashboardProvider>
    )
    await act(async () =>
      pending.resolve('request-2', { languages: [{ id: 'de' }] })
    )
    await act(async () =>
      pending.resolve('request-1', { languages: [{ id: 'en' }] })
    )

    expect(screen.getByTestId('languages').textContent).toBe('de')
  })
})
