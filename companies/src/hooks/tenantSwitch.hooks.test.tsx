/**
 * @vitest-environment jsdom
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'
import { useCountries } from './useCountries'
import { useCurrencies } from './useCurrencies'
import { useMixinColumns } from './useMixinColumns'

const api = vi.hoisted(() => ({
  syncAllCountries: vi.fn(),
  syncAllRegions: vi.fn(),
  getAllTaxesUnpaginated: vi.fn(),
  syncCurrencies: vi.fn(),
  getSchemas: vi.fn(),
}))
vi.mock('./api/countries', () => ({ useCountriesApi: () => api }))
vi.mock('./api/taxes', () => ({ useTaxesApi: () => api }))
vi.mock('./api/currencies', () => ({ useCurrenciesApi: () => api }))
vi.mock('./api/schema', () => ({ useSchemaApi: () => api }))
vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}))
vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ currentCurrency: undefined }),
}))
vi.mock('../helpers/schema.helper', () => ({
  parseMixinColumns: (schemas: { id: string }[]) =>
    schemas.map((schema) => ({ key: schema.id })),
}))

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

/** Renders `hook` under a host tenant that `switchTenant` changes. */
const renderWithTenant = <T,>(hook: () => T) => {
  let tenant = 'tenant-a'
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DashboardProvider appState={appStateFor(tenant)}>
      {children}
    </DashboardProvider>
  )
  const result = renderHook(hook, { wrapper })
  return {
    ...result,
    switchTenant: (next: string) => {
      tenant = next
      result.rerender()
    },
  }
}

/** A pending response the test resolves later (the "slow" previous tenant). */
const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe('tenant-scoped hooks on a host tenant switch', () => {
  afterEach(() => {
    cleanup()
    Object.values(api).forEach((fn) => fn.mockReset())
  })

  it('useCountries drops the previous tenant countries and its late response', async () => {
    const slowA = deferred<{ values: unknown[] }>()
    api.syncAllCountries
      .mockReturnValueOnce(slowA.promise)
      .mockResolvedValueOnce({ values: [{ code: 'PL', active: true }] })
    api.syncAllRegions.mockResolvedValue([])

    const { result, switchTenant } = renderWithTenant(() => useCountries())
    switchTenant('tenant-b')
    await waitFor(() =>
      expect(result.current.countries.map((c) => c.code)).toEqual(['PL'])
    )

    await act(async () => {
      slowA.resolve({ values: [{ code: 'DE', active: true }] })
    })
    expect(result.current.countries.map((c) => c.code)).toEqual(['PL'])
  })

  it('useCurrencies drops the previous tenant currencies and its late response', async () => {
    const slowA = deferred<unknown[]>()
    api.syncCurrencies
      .mockReturnValueOnce(slowA.promise)
      .mockResolvedValueOnce([{ code: 'PLN', name: { en: 'Zloty' } }])

    const { result, switchTenant } = renderWithTenant(() => useCurrencies())
    switchTenant('tenant-b')
    await waitFor(() =>
      expect(result.current.selectedCurrency?.code).toBe('PLN')
    )

    await act(async () => {
      slowA.resolve([{ code: 'EUR', name: { en: 'Euro' } }])
    })
    expect(result.current.currencies.map((c) => c.code)).toEqual(['PLN'])
    expect(result.current.selectedCurrency?.code).toBe('PLN')
  })

  it('useMixinColumns drops the previous tenant columns and its late response', async () => {
    const slowA = deferred<unknown[]>()
    api.getSchemas
      .mockReturnValueOnce(slowA.promise)
      .mockResolvedValueOnce([{ id: 'b-schema' }])

    const { result, switchTenant } = renderWithTenant(() =>
      useMixinColumns('COMPANY')
    )
    switchTenant('tenant-b')
    await waitFor(() =>
      expect(result.current.mixinColumns).toEqual([{ key: 'b-schema' }])
    )

    await act(async () => {
      slowA.resolve([{ id: 'a-schema' }])
    })
    expect(result.current.mixinColumns).toEqual([{ key: 'b-schema' }])
  })
})
