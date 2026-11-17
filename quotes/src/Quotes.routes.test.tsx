/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createHashRouter, RouterProvider, type DataRouter } from 'react-router'
import i18n from './translations/i18n'
import { EmployeeDomains } from './configs/accessControls'
import { DashboardProvider } from './context/Dashboard.context'
import type { AppState } from './models/AppState.model'
import { DEFAULT_APP_CURRENCY } from './constants/currency'
import { quotesRoutes } from './Quotes.routes'

const api = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  updateQuote: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const sites = vi.hoisted(() => ({
  value: { sites: [], currentSite: undefined, updateCurrentSite: () => {} },
}))
/**
 * The mixins hook as a tiny store, so a test can play a reload (loading
 * placeholder, then the mixin tabs again) the way the real hook does.
 */
const mixins = vi.hoisted(() => ({
  loadMixins: vi.fn(),
  tabs: [] as { id: string; label: string; content: unknown }[],
  isLoading: false,
  version: 0,
  listeners: new Set<() => void>(),
}))
const setMixinsState = (
  isLoading: boolean,
  tabs: { id: string; label: string; content: unknown }[]
) => {
  mixins.isLoading = isLoading
  mixins.tabs = tabs
  mixins.version++
  mixins.listeners.forEach((listener) => listener())
}
const generalMounts = vi.hoisted(() => ({ count: 0 }))

vi.mock('./hooks/api/quotes', () => ({ useQuotesApi: () => api }))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})
vi.mock('./context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: [],
  }),
}))
vi.mock('./context/SitesProvider', () => ({ useSites: () => sites.value }))
// The mixins subsystem is tested on its own; the page hands it the quote.
vi.mock('./components/mixins/useMixinsForm', async () => {
  const { useSyncExternalStore } = await import('react')
  const useMixinsFormStub = () => {
    useSyncExternalStore(
      (listener: () => void) => {
        mixins.listeners.add(listener)
        return () => mixins.listeners.delete(listener)
      },
      () => mixins.version
    )
    return {
      loadMixins: mixins.loadMixins,
      isMixinsLoading: mixins.isLoading,
      mixinsTabs: mixins.tabs,
    }
  }
  return {
    MIXINS_LOADING_TAB_ID: 'mixins-loading',
    default: useMixinsFormStub,
  }
})
vi.mock('./components/auditLog/EntityChangelogTab', () => ({
  default: () => <div data-testid="audit-log" />,
}))

/**
 * The real table re-fetches its rows whenever `refresh` is set, including on
 * mount, so the stub records the value it mounted with.
 */
vi.mock('./components/quotes/QuotesTable', async () => {
  const { useState } = await import('react')
  const { useRefresh } = await import('./context/RefreshValuesProvider')
  const QuotesTableStub = () => {
    const { refresh } = useRefresh()
    const [refreshAtMount] = useState(refresh)
    return (
      <div
        data-testid="quotes-table"
        data-refresh-at-mount={String(refreshAtMount)}
      />
    )
  }
  return { default: QuotesTableStub }
})

/**
 * The General tab keeps its own form state. The stub counts local edits,
 * replaces `add` with the created id the way the real Save does, asks for a
 * refresh the way an approve or decline does, and goes back to the list.
 */
vi.mock('./components/quotes/QuotesTabGeneral', async () => {
  const { useEffect, useState } = await import('react')
  const { useNavigate } = await import('react-router')
  const { useRefresh } = await import('./context/RefreshValuesProvider')
  const GeneralTabStub = () => {
    useEffect(() => {
      generalMounts.count++
    }, [])
    const [edits, setEdits] = useState(0)
    const navigate = useNavigate()
    const { setRefreshValue } = useRefresh()
    return (
      <div data-testid="general-tab">
        <span data-testid="general-edits">{edits}</span>
        <button
          data-testid="general-edit"
          onClick={() => setEdits((count: number) => count + 1)}
        />
        <button
          data-testid="general-save"
          onClick={() => navigate('/Q-NEW', { replace: true })}
        />
        <button
          data-testid="general-request-refresh"
          onClick={() => setRefreshValue()}
        />
        <button
          data-testid="general-open-products"
          onClick={() => navigate({ search: '?tab=1' }, { replace: true })}
        />
        <button data-testid="general-back" onClick={() => navigate('/')} />
      </div>
    )
  }
  return { default: GeneralTabStub }
})
vi.mock('./components/quotes/QuotesTabProducts', () => ({
  default: () => <div data-testid="products-tab" />,
}))
vi.mock('./components/quotes/QuotesTabPreview', () => ({
  default: () => <div data-testid="preview-tab" />,
}))
vi.mock('./components/quotes/QuotesTabApproval', () => ({
  default: () => <div data-testid="approval-tab" />,
}))

const quote = (id: string) => ({
  id,
  status: { value: 'OPEN' },
  siteCode: 'main',
  businessModel: 'B2B',
  items: [],
  metadata: { mixins: {} },
  mixins: {},
})

/** Settles on the next macrotask, like a response. */
const later = <T,>(settle: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(settle())
      } catch (error) {
        reject(error)
      }
    }, 0)
  )

/** A pending response the test settles itself (a "slow" request). */
const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined
  let reject: (error: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: 'token',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
})

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

let router: DataRouter | undefined

/** The remote's hash routes (`RemoteComponent`), opened at `#{path}`. */
const renderAt = async (path: string, tenant = 'tenant-a') => {
  window.location.hash = `#${path}`
  router = createHashRouter(quotesRoutes)
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant)}>
      <RouterProvider router={router as DataRouter} />
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  await flush()
  return {
    ...result,
    switchTenant: async (next: string) => {
      result.rerender(tree(next))
      await flush()
    },
  }
}

const location = () =>
  `${router?.state.location.pathname}${router?.state.location.search}`
const byTestId = (id: string) => screen.queryByTestId(id)
const tab = (id: string) =>
  screen.getByTestId(`quote-tabs-tab-${id}`) as HTMLButtonElement
const click = async (element: HTMLElement | null) => {
  if (element) fireEvent.click(element)
  await flush()
}

describe('Quotes routes', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = []
    api.getQuoteById.mockImplementation((id: string) => later(() => quote(id)))
  })

  afterEach(() => {
    cleanup()
    router?.dispose()
    router = undefined
    window.location.hash = ''
    vi.clearAllMocks()
    api.getQuoteById.mockReset()
    setMixinsState(false, [])
    generalMounts.count = 0
  })

  describe('Scenario 13 — list URL (#/)', () => {
    it('shows the quotes list inside one module wrapper', async () => {
      const { container } = await renderAt('/')

      expect(screen.getByRole('heading', { name: 'Quotes' })).toBeTruthy()
      expect(byTestId('quotes-table')).not.toBeNull()
      expect(container.querySelectorAll('.module')).toHaveLength(1)
      expect(api.getQuoteById).not.toHaveBeenCalled()
    })

    it('disables the create button without Quotes Manager', async () => {
      await renderAt('/')

      const create = screen.getByTestId('quotes-create') as HTMLButtonElement
      expect(create.textContent).toBe('Create quote')
      expect(create.disabled).toBe(true)
    })

    it('lets a Quotes Manager open the create page', async () => {
      permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
      await renderAt('/')

      const create = screen.getByTestId('quotes-create') as HTMLButtonElement
      expect(create.disabled).toBe(false)
      await click(create)

      expect(location()).toBe('/add')
      expect(byTestId('general-tab')).not.toBeNull()
    })
  })

  describe('Scenario 13 — create URL (#/add)', () => {
    it('opens the form in create mode with only the General tab enabled', async () => {
      await renderAt('/add')

      expect(screen.getByRole('heading', { name: 'Quote' })).toBeTruthy()
      expect(byTestId('general-tab')).not.toBeNull()
      expect(tab('general').disabled).toBe(false)
      for (const id of ['products', 'preview', 'approval']) {
        expect(tab(id).disabled).toBe(true)
      }
      expect(api.getQuoteById).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 13 — edit URL and deep link (#/{id})', () => {
    it('loads the quote of the URL and shows it on the General tab', async () => {
      const { container } = await renderAt('/Q1000814')

      expect(api.getQuoteById).toHaveBeenCalledWith('Q1000814')
      expect(screen.getByRole('heading', { name: 'Q1000814' })).toBeTruthy()
      expect(byTestId('general-tab')).not.toBeNull()
      expect(tab('products').disabled).toBe(false)
      expect(container.querySelectorAll('.module')).toHaveLength(1)
      expect(mixins.loadMixins).toHaveBeenCalledWith({}, {})
    })

    // COP-7116: the heading names the status of a completed quote.
    it('names the status of a completed quote next to its id', async () => {
      api.getQuoteById.mockImplementation((id: string) =>
        later(() => ({
          ...quote(id),
          status: { value: 'DECLINED_BY_MERCHANT' },
        }))
      )
      await renderAt('/Q1')

      expect(screen.getByText('DECLINED BY MERCHANT')).toBeTruthy()
      expect(screen.queryByText('DECLINED_BY_MERCHANT')).toBeNull()
    })

    // COP-7116: MD reloaded the mixins (schema and reference requests) on
    // every render of the quote provider, so also on every tab switch.
    it('loads the mixins once for the loaded quote', async () => {
      await renderAt('/Q1')
      await click(tab('products'))
      await click(tab('general'))

      expect(mixins.loadMixins).toHaveBeenCalledTimes(1)
    })

    it('opens the Preview tab of #/{id}?tab=preview', async () => {
      await renderAt('/Q1?tab=preview')

      expect(byTestId('preview-tab')).not.toBeNull()
      expect(byTestId('general-tab')).toBeNull()
    })

    it('opens the tab named by `?tab=` (index or name)', async () => {
      await renderAt('/Q1?tab=1')
      expect(byTestId('products-tab')).not.toBeNull()
      expect(byTestId('general-tab')).toBeNull()

      cleanup()
      router?.dispose()
      await renderAt('/Q1?tab=approval')
      expect(byTestId('approval-tab')).not.toBeNull()
    })

    it('opens a quote linked with a `backTo` query', async () => {
      await renderAt('/Q7?backTo=/apps/management/carts/C1')

      expect(api.getQuoteById).toHaveBeenCalledWith('Q7')
      expect(byTestId('general-tab')).not.toBeNull()
    })

    it('opens an id with reserved characters as one segment', async () => {
      await renderAt('/Q%2F1%232')

      expect(api.getQuoteById).toHaveBeenCalledWith('Q/1#2')
    })

    it('keeps a mixin tab open while the mixins reload, without mounting General', async () => {
      const mixinTab = {
        id: 'additionalInfo',
        label: 'Additional Info',
        content: <div data-testid="mixin-tab" />,
      }
      setMixinsState(false, [mixinTab])
      await renderAt('/Q1?tab=additionalInfo')
      expect(byTestId('mixin-tab')).not.toBeNull()
      generalMounts.count = 0

      // The page reloads the mixins on every render (MD quirk): a loading
      // placeholder replaces the mixin tabs, then they come back.
      act(() =>
        setMixinsState(true, [
          { id: 'mixins-loading', label: 'Loading', content: null },
        ])
      )
      await flush()
      act(() => setMixinsState(false, [mixinTab]))
      await flush()

      expect(generalMounts.count).toBe(0)
      expect(byTestId('mixin-tab')).not.toBeNull()
      expect(location()).toBe('/Q1?tab=additionalInfo')
    })
  })

  describe('Scenario 14 — create then edit', () => {
    it('replaces #/add with the new id and remounts the form', async () => {
      await renderAt('/add')

      await click(byTestId('general-edit'))
      expect(byTestId('general-edits')?.textContent).toBe('1')

      await click(byTestId('general-save'))
      await flush()

      expect(location()).toBe('/Q-NEW')
      expect(api.getQuoteById).toHaveBeenCalledWith('Q-NEW')
      expect(screen.getByRole('heading', { name: 'Q-NEW' })).toBeTruthy()
      expect(byTestId('general-edits')?.textContent).toBe('0')
    })
  })

  describe('Requirement 11 — no request added by the module shell', () => {
    it('does not reload the list on return after a quote page asked for a refresh', async () => {
      await renderAt('/Q1')

      await click(byTestId('general-request-refresh'))
      await click(byTestId('general-back'))

      expect(location()).toBe('/')
      expect(byTestId('quotes-table')?.dataset.refreshAtMount).toBe('0')
    })

    it('does not fetch the quote again when only `?tab=` changes', async () => {
      await renderAt('/Q1')
      expect(api.getQuoteById).toHaveBeenCalledTimes(1)

      await click(byTestId('general-open-products'))

      expect(location()).toBe('/Q1?tab=1')
      expect(byTestId('products-tab')).not.toBeNull()
      expect(api.getQuoteById).toHaveBeenCalledTimes(1)
    })
  })

  describe('Scenario 13 — unknown nested path (#/{id}/x)', () => {
    it('shows the list (MD showed its not-found page)', async () => {
      await renderAt('/Q1/anything')

      expect(location()).toBe('/')
      expect(byTestId('quotes-table')).not.toBeNull()
      expect(api.getQuoteById).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 15 — quote cannot be loaded', () => {
    it('goes back to the list with an error toast', async () => {
      api.getQuoteById.mockImplementation(() =>
        later(() => {
          throw new Error('404')
        })
      )

      await renderAt('/MISSING')
      await flush()

      expect(location()).toBe('/')
      expect(byTestId('quotes-table')).not.toBeNull()
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while loading quote. Please try again later',
        '',
        'error'
      )
    })
  })

  describe('Requirement 18 — host tenant switch', () => {
    it('returns an open quote to the list', async () => {
      const { switchTenant } = await renderAt('/Q1', 'tenant-a')
      expect(byTestId('general-tab')).not.toBeNull()

      await switchTenant('tenant-b')

      expect(location()).toBe('/')
      expect(byTestId('quotes-table')).not.toBeNull()
    })

    it('returns the create page to the list', async () => {
      const { switchTenant } = await renderAt('/add', 'tenant-a')

      await switchTenant('tenant-b')

      expect(location()).toBe('/')
    })

    it('ignores the late response for the previous tenant', async () => {
      const slow = deferred<ReturnType<typeof quote>>()
      api.getQuoteById.mockReturnValue(slow.promise)
      const { switchTenant } = await renderAt('/Q1', 'tenant-a')

      await switchTenant('tenant-b')
      await act(async () => slow.reject(new Error('Not found')))
      await flush()

      expect(location()).toBe('/')
      expect(toast.showToast).not.toHaveBeenCalled()
    })

    it('ignores the late response for the previous id', async () => {
      const slow = deferred<ReturnType<typeof quote>>()
      api.getQuoteById.mockImplementation((id: string) =>
        id === 'Q1' ? slow.promise : later(() => quote(id))
      )
      await renderAt('/Q1')

      await click(byTestId('general-save'))
      await flush()
      await act(async () => slow.reject(new Error('Not found')))
      await flush()

      expect(location()).toBe('/Q-NEW')
      expect(screen.getByRole('heading', { name: 'Q-NEW' })).toBeTruthy()
      expect(toast.showToast).not.toHaveBeenCalled()
    })
  })
})
