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
import FeatureTogglesProvider, {
  useFeatureToggles,
} from './FeatureTogglesProvider'
import {
  ReferenceOptionsProvider,
  useReferenceOptions,
} from './ReferenceOptionsProvider'
import { SitesProvider, useSites } from './SitesProvider'
import type { AppState } from '../models/AppState.model'

/** One pending request per tenant, resolved by the test in any order. */
const pending = vi.hoisted(() => {
  const resolvers = new Map<string, (value: unknown) => void>()
  return {
    request: (tenant: string) =>
      new Promise((resolve) => resolvers.set(tenant, resolve)),
    resolve: (tenant: string, value: unknown) => resolvers.get(tenant)?.(value),
    clear: () => resolvers.clear(),
  }
})

/** Stable API functions per tenant, like the memoized real hooks. */
const stable = vi.hoisted(() => {
  const cache = new Map<string, () => Promise<unknown>>()
  return (key: string, request: () => Promise<unknown>) => {
    if (!cache.has(key)) cache.set(key, request)
    return cache.get(key) as () => Promise<unknown>
  }
})

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return { ...actual, fetchBasicConfiguration: vi.fn() }
})

vi.mock('../hooks/api/featureToggles', async () => {
  const { useDashboardContext } = await import('./Dashboard.context')
  return {
    useFeatureTogglesApi: () => {
      const { tenant } = useDashboardContext()
      return {
        getAllFeatureToggleValues: stable(`toggles:${tenant}`, () =>
          pending.request(`toggles:${tenant}`)
        ),
      }
    },
  }
})

vi.mock('../hooks/api/customEntities', async () => {
  const { useDashboardContext } = await import('./Dashboard.context')
  return {
    useCustomEntitiesApi: () => {
      const { tenant } = useDashboardContext()
      return {
        getAllCustomEntities: stable(`entities:${tenant}`, () =>
          pending.request(`entities:${tenant}`)
        ),
      }
    },
  }
})

vi.mock('../api/sites', async () => {
  const { useDashboardContext } = await import('./Dashboard.context')
  return {
    useSitesApi: () => {
      const { tenant } = useDashboardContext()
      return {
        getSites: stable(`sites:${tenant}`, () =>
          pending.request(`sites:${tenant}`)
        ),
      }
    },
  }
})

const appState = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: 'token',
  contentLanguage: 'en',
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

const flush = () => act(async () => Promise.resolve())

describe('providers on a host tenant switch', () => {
  afterEach(() => {
    cleanup()
    pending.clear()
    vi.mocked(fetchBasicConfiguration).mockReset()
  })

  it('keeps the new tenant configuration when the old response arrives late', async () => {
    vi.mocked(fetchBasicConfiguration).mockImplementation(
      (tenant: string) =>
        pending.request(`config:${tenant}`) as ReturnType<
          typeof fetchBasicConfiguration
        >
    )
    const Probe = () => (
      <span data-testid="value">
        {useConfiguration()
          .languages.map((language) => language.id)
          .join(',') || 'none'}
      </span>
    )
    const switchTenant = renderForTenant(
      'a',
      <ConfigurationProvider>
        <Probe />
      </ConfigurationProvider>
    )

    switchTenant('b')
    await act(async () =>
      pending.resolve('config:b', { languages: [{ id: 'de' }] })
    )
    await act(async () =>
      pending.resolve('config:a', { languages: [{ id: 'en' }] })
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('de')
  })

  it('keeps the new tenant feature toggles when the old response arrives late', async () => {
    const Probe = () => (
      <span data-testid="value">
        {useFeatureToggles().isToggleValid('coupon-x') ? 'on' : 'off'}
      </span>
    )
    const switchTenant = renderForTenant(
      'a',
      <FeatureTogglesProvider>
        <Probe />
      </FeatureTogglesProvider>
    )

    switchTenant('b')
    await act(async () =>
      pending.resolve('toggles:b', [{ code: 'coupon-x', isEnabled: false }])
    )
    await act(async () =>
      pending.resolve('toggles:a', [{ code: 'coupon-x', isEnabled: true }])
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('off')
  })

  it('keeps the new tenant reference options when the old response arrives late', async () => {
    const Probe = () => (
      <span data-testid="value">
        {useReferenceOptions()
          .customEntities.map((entity) => entity.id)
          .join(',') || 'none'}
      </span>
    )
    const switchTenant = renderForTenant(
      'a',
      <ReferenceOptionsProvider>
        <Probe />
      </ReferenceOptionsProvider>
    )

    switchTenant('b')
    await act(async () => pending.resolve('entities:b', [{ id: 'B_ENTITY' }]))
    await act(async () => pending.resolve('entities:a', [{ id: 'A_ENTITY' }]))
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('B_ENTITY')
  })

  it('keeps the new tenant sites when the old response arrives late', async () => {
    const Probe = () => {
      const { sites, currentSite } = useSites()
      return (
        <span data-testid="value">
          {`${sites.map((site) => site.code).join(',')}|${currentSite?.code ?? ''}`}
        </span>
      )
    }
    const switchTenant = renderForTenant(
      'a',
      <SitesProvider>
        <Probe />
      </SitesProvider>
    )

    switchTenant('b')
    await act(async () =>
      pending.resolve('sites:b', [{ code: 'b-main', default: true }])
    )
    await act(async () =>
      pending.resolve('sites:a', [{ code: 'a-main', default: true }])
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('b-main|b-main')
  })
})
