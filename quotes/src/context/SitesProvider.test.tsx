/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { DashboardProvider, useDashboardContext } from './Dashboard.context'
import { SitesProvider, useSites } from './SitesProvider'
import type { AppState } from '../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../constants/currency'

/** One pending sites request per tenant, resolved by the test. */
const pending = vi.hoisted(() => {
  const resolvers = new Map<string, (value: unknown) => void>()
  const requests = new Map<string, Promise<unknown>>()
  return {
    request: (tenant: string) => {
      if (!requests.has(tenant)) {
        requests.set(
          tenant,
          new Promise((resolve) => resolvers.set(tenant, resolve))
        )
      }
      return requests.get(tenant) as Promise<unknown>
    },
    resolve: (tenant: string, value: unknown) => resolvers.get(tenant)?.(value),
    clear: () => {
      resolvers.clear()
      requests.clear()
    },
  }
})

/** Stable per tenant, like the memoized real hook. */
const stable = vi.hoisted(() => {
  const cache = new Map<string, () => Promise<unknown>>()
  return {
    get: (tenant: string) => {
      if (!cache.has(tenant)) {
        cache.set(tenant, () => pending.request(tenant))
      }
      return cache.get(tenant) as () => Promise<unknown>
    },
    clear: () => cache.clear(),
  }
})

vi.mock('../api/sites', async () => {
  const { useDashboardContext } = await import('./Dashboard.context')
  return {
    useSitesApi: () => ({ getSites: stable.get(useDashboardContext().tenant) }),
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

const persistHostSites = (
  tenant: string,
  sites: { code: string; default?: boolean }[],
  currentSite: string
) => {
  localStorage.setItem('tenant', tenant)
  localStorage.setItem('sites', JSON.stringify(sites))
  localStorage.setItem('currentSite', JSON.stringify({ code: currentSite }))
}

/** Every render's tenant and site, to catch a mixed one. */
const seen: string[] = []

const Probe = () => {
  const { tenant } = useDashboardContext()
  const { sites, currentSite } = useSites()
  const text = `${tenant}:${(sites ?? []).map((s) => s.code).join(',')}|${currentSite?.code ?? ''}`
  seen.push(text)
  return <span data-testid="value">{text}</span>
}

const renderForTenant = (tenant: string) => {
  const tree = (current: string) => (
    <DashboardProvider appState={appState(current)}>
      <SitesProvider>
        <Probe />
      </SitesProvider>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return (next: string) => result.rerender(tree(next))
}

const value = () => screen.getByTestId('value').textContent

describe('SitesProvider', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    pending.clear()
    stable.clear()
    seen.length = 0
  })

  it("starts from the host's site of the same tenant and keeps it", async () => {
    persistHostSites(
      'a',
      [{ code: 'main', default: true }, { code: 'b2b' }],
      'b2b'
    )

    renderForTenant('a')
    expect(value()).toBe('a:main,b2b|b2b')

    await act(async () =>
      pending.resolve('a', [{ code: 'main', default: true }, { code: 'b2b' }])
    )
    expect(value()).toBe('a:main,b2b|b2b')
  })

  it('takes the default site when the host site is gone', async () => {
    persistHostSites('a', [{ code: 'old' }], 'old')

    renderForTenant('a')
    await act(async () =>
      pending.resolve('a', [{ code: 'x' }, { code: 'main', default: true }])
    )

    expect(value()).toBe('a:x,main|main')
  })

  it('ignores the sites the host keeps for another tenant', () => {
    persistHostSites('other', [{ code: 'main' }], 'main')

    renderForTenant('a')

    expect(value()).toBe('a:|')
  })

  it('drops the previous tenant sites in the render that switches', async () => {
    persistHostSites('a', [{ code: 'a-main', default: true }], 'a-main')
    const switchTenant = renderForTenant('a')

    switchTenant('b')
    await act(async () =>
      pending.resolve('b', [{ code: 'b-main', default: true }])
    )
    await act(async () =>
      pending.resolve('a', [{ code: 'a-main', default: true }])
    )

    expect(value()).toBe('b:b-main|b-main')
    expect(
      seen.filter((text) => text.startsWith('b:') && text.includes('a-main'))
    ).toEqual([])
  })
})
