/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { DashboardProvider } from './Dashboard.context'
import FeatureTogglesProvider, {
  useFeatureToggles,
} from './FeatureTogglesProvider'
import { SitesProvider, useSites } from './SitesProvider'
import type { AppState } from '../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../constants/currency'

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

const flush = () => act(async () => Promise.resolve())

describe('providers on a host tenant switch', () => {
  afterEach(() => {
    cleanup()
    pending.clear()
  })

  it('keeps the new tenant feature toggles when the old response arrives late', async () => {
    const Probe = () => {
      const { isToggleValid, togglesLoading } = useFeatureToggles()
      return (
        <span data-testid="value">
          {`${isToggleValid('catalog-x') ? 'on' : 'off'}|${togglesLoading ? 'loading' : 'done'}`}
        </span>
      )
    }
    const switchTenant = renderForTenant(
      'a',
      <FeatureTogglesProvider>
        <Probe />
      </FeatureTogglesProvider>
    )

    switchTenant('b')
    await act(async () =>
      pending.resolve('toggles:a', [{ code: 'catalog-x', isEnabled: true }])
    )
    await flush()
    // The old tenant's late answer neither applies nor ends the new load.
    expect(screen.getByTestId('value').textContent).toBe('off|loading')

    await act(async () =>
      pending.resolve('toggles:b', [{ code: 'catalog-x', isEnabled: false }])
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('off|done')
  })

  it('drops the old tenant sites and keeps the new ones when the old response arrives late', async () => {
    const Probe = () => {
      const { sites, currentSite } = useSites()
      return (
        <span data-testid="value">
          {`${(sites ?? []).map((site) => site.code).join(',')}|${currentSite?.code ?? ''}`}
        </span>
      )
    }
    const switchTenant = renderForTenant(
      'a',
      <SitesProvider>
        <Probe />
      </SitesProvider>
    )
    await act(async () =>
      pending.resolve('sites:a', [{ code: 'a-main', default: true }])
    )
    await flush()
    expect(screen.getByTestId('value').textContent).toBe('a-main|a-main')

    pending.clear()
    switchTenant('b')
    await flush()
    // The previous tenant's sites are not offered while the new ones load.
    expect(screen.getByTestId('value').textContent).toBe('|')

    await act(async () =>
      pending.resolve('sites:b', [{ code: 'b-main', default: true }])
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('b-main|b-main')
  })

  it('ignores a late sites response from the previous tenant', async () => {
    const Probe = () => {
      const { sites, currentSite } = useSites()
      return (
        <span data-testid="value">
          {`${(sites ?? []).map((site) => site.code).join(',')}|${currentSite?.code ?? ''}`}
        </span>
      )
    }
    const switchTenant = renderForTenant(
      'c',
      <SitesProvider>
        <Probe />
      </SitesProvider>
    )

    switchTenant('d')
    await act(async () =>
      pending.resolve('sites:d', [{ code: 'd-main', default: true }])
    )
    await act(async () =>
      pending.resolve('sites:c', [{ code: 'c-main', default: true }])
    )
    await flush()

    expect(screen.getByTestId('value').textContent).toBe('d-main|d-main')
  })
})
