/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import { RefreshValuesProvider } from '../../context/RefreshValuesProvider'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import QuotesTable from './QuotesTable'

/** Requests by tenant, so a test can tell the previous tenant's apart. */
const quotesApi = vi.hoisted(() => ({
  getQuotes: vi.fn(),
  deleteQuote: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({
  granted: [] as string[],
  userScopes: [] as string[],
}))
const sites = vi.hoisted(() => {
  const main = { code: 'main', name: 'Main' }
  const second = { code: 'second', name: 'Second' }
  return {
    main,
    second,
    value: {
      sites: [main, second],
      currentSite: main as { code: string; name: string } | undefined,
      updateCurrentSite: vi.fn(),
    },
  }
})

vi.mock('../../hooks/api/quotes', async () => {
  const { useDashboardContext } = await import(
    '../../context/Dashboard.context'
  )
  return {
    useQuotesApi: () => {
      const { tenant } = useDashboardContext()
      return {
        getQuotes: (pagination: unknown, siteCode?: string) =>
          quotesApi.getQuotes(tenant, pagination, siteCode),
        deleteQuote: (id: string) => quotesApi.deleteQuote(tenant, id),
      }
    },
  }
})
vi.mock('../../hooks/api/configuration', () => ({
  useConfigurationApi: () => ({
    getSyncBetweenRestrictionsAndSiteCodes: async () => ({ value: true }),
  }),
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: permissions.userScopes,
  }),
}))
vi.mock('../../context/SitesProvider', () => ({ useSites: () => sites.value }))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const quote = (id: string, company: string) => ({
  id,
  company: { name: company },
  status: { value: 'OPEN' },
  metadata: { createdAt: '2026-11-10T10:00:00.000Z' },
  totalPrice: { currency: 'EUR', grossValue: 10, netValue: 8, taxValue: 2 },
  items: [],
})

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((res) => (resolve = res))
  return { promise, resolve }
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

const renderTable = (tenant = 'tenant-a') => {
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant)}>
      <MemoryRouter initialEntries={['/']}>
        <RefreshValuesProvider>
          <QuotesTable />
        </RefreshValuesProvider>
      </MemoryRouter>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return {
    ...result,
    switchTenant: (next: string) => result.rerender(tree(next)),
  }
}

const rows = () =>
  within(screen.getByTestId('quotes-table'))
    .queryAllByRole('row')
    .map((row) => row.textContent ?? '')

describe('QuotesTable', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    permissions.userScopes = []
    sites.value.currentSite = sites.main
    quotesApi.getQuotes.mockImplementation(async (tenant: string) => ({
      data: [quote(`${tenant}-Q1`, 'Acme')],
      totalRecords: 1,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    quotesApi.getQuotes.mockReset()
    quotesApi.deleteQuote.mockReset()
  })

  it('loads the quotes of the current site, newest first', async () => {
    renderTable()

    await waitFor(() =>
      expect(rows().some((row) => row.includes('tenant-a-Q1'))).toBe(true)
    )
    expect(quotesApi.getQuotes).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({
        currentPage: 1,
        rows: 10,
        sortField: 'metadata.createdAt',
        sortOrder: -1,
      }),
      'main'
    )
  })

  it('switches a restricted site to an allowed one without loading it', async () => {
    permissions.userScopes = ['quote.quote_read--second']
    renderTable()

    await waitFor(() =>
      expect(sites.value.updateCurrentSite).toHaveBeenCalledWith(sites.second)
    )
    expect(toast.showToast).toHaveBeenCalledWith(
      'You do not have permission to access Quotes for site main. Please contact your administrator for further assistance.',
      '',
      'error'
    )
    expect(quotesApi.getQuotes).not.toHaveBeenCalledWith(
      'tenant-a',
      expect.anything(),
      'main'
    )
  })

  // Requirement 18
  it('keeps the new tenant quotes when the previous tenant answers late', async () => {
    const slowA = deferred<{ data: unknown[]; totalRecords: number }>()
    quotesApi.getQuotes.mockImplementation((tenant: string) =>
      tenant === 'tenant-a'
        ? slowA.promise
        : Promise.resolve({
            data: [quote('tenant-b-Q1', 'Beta')],
            totalRecords: 1,
          })
    )
    const { switchTenant } = renderTable('tenant-a')

    switchTenant('tenant-b')
    await waitFor(() =>
      expect(rows().some((row) => row.includes('tenant-b-Q1'))).toBe(true)
    )
    await act(async () =>
      slowA.resolve({ data: [quote('tenant-a-Q1', 'Acme')], totalRecords: 1 })
    )

    expect(rows().some((row) => row.includes('tenant-b-Q1'))).toBe(true)
    expect(rows().some((row) => row.includes('tenant-a-Q1'))).toBe(false)
  })

  // Requirement 18
  it('deletes a row of the new tenant in the new tenant', async () => {
    quotesApi.deleteQuote.mockResolvedValue({})
    const { switchTenant } = renderTable('tenant-a')
    await waitFor(() =>
      expect(rows().some((row) => row.includes('tenant-a-Q1'))).toBe(true)
    )

    switchTenant('tenant-b')
    await waitFor(() =>
      expect(rows().some((row) => row.includes('tenant-b-Q1'))).toBe(true)
    )
    fireEvent.click(screen.getAllByTestId('delete-button')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(quotesApi.deleteQuote).toHaveBeenCalledWith(
        'tenant-b',
        'tenant-b-Q1'
      )
    )
  })

  // COP-7116: MD reloaded the rows only, so the paginator total stayed stale.
  it('reloads the rows and the total after a delete', async () => {
    quotesApi.getQuotes.mockResolvedValueOnce({
      data: [quote('Q1', 'Acme'), quote('Q2', 'Beta')],
      totalRecords: 2,
    })
    quotesApi.getQuotes.mockResolvedValue({
      data: [quote('Q2', 'Beta')],
      totalRecords: 1,
    })
    quotesApi.deleteQuote.mockResolvedValue({})
    renderTable()
    await waitFor(() => expect(screen.getByText(/of 2$/)).toBeTruthy())

    fireEvent.click(screen.getAllByTestId('delete-button')[0])
    expect(
      screen.getByText('Are you sure you want to delete quote Q1?')
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Quote Q1 deleted',
        '',
        'success'
      )
    )
    await waitFor(() =>
      expect(rows().some((row) => row.includes('Q1'))).toBe(false)
    )
    expect(quotesApi.deleteQuote).toHaveBeenCalledWith('tenant-a', 'Q1')
    await waitFor(() => expect(screen.getByText(/of 1$/)).toBeTruthy())
    expect(screen.queryByText(/of 2$/)).toBeNull()
  })

  // COP-7116 QA (Maryna): error toasts name the cause from the API.
  it('shows the cause from the API when a delete fails', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      data: [quote('Q1', 'Acme')],
      totalRecords: 1,
    })
    quotesApi.deleteQuote.mockRejectedValue({
      response: { status: 409, data: { message: 'Quote Q1 is locked' } },
    })
    renderTable()
    await waitFor(() => expect(screen.getByText(/of 1$/)).toBeTruthy())

    fireEvent.click(screen.getAllByTestId('delete-button')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while deleting quote Q1 ',
        'Quote Q1 is locked'
      )
    )
    expect(rows().some((row) => row.includes('Q1'))).toBe(true)
  })

  // COP-7116: status names instead of the API codes; the filter still sends
  // the code.
  it('names the statuses in the column and the filter, and filters by the API code', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      data: [
        { ...quote('Q1', 'Acme'), status: { value: 'IN_PROGRESS' } },
        { ...quote('Q2', 'Beta'), status: { value: 'DECLINED_BY_MERCHANT' } },
      ],
      totalRecords: 2,
    })
    renderTable()
    await waitFor(() => expect(screen.getByText(/of 2$/)).toBeTruthy())

    expect(rows().some((row) => row.includes('PENDING'))).toBe(true)
    expect(rows().some((row) => row.includes('DECLINED BY MERCHANT'))).toBe(
      true
    )
    expect(rows().some((row) => row.includes('_'))).toBe(false)
    fireEvent.click(screen.getByTestId('quotes-status-filter-control'))
    const options = within(
      screen.getByTestId('quotes-status-filter-panel')
    ).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'OPEN',
      'PENDING',
      'ACCEPTED',
      'DECLINED',
      'DECLINED BY MERCHANT',
      'EXPIRED',
      'AWAITING',
      'CREATING',
    ])
    // CL Dropdown selects an option on mouse down.
    fireEvent.mouseDown(options[1])

    await waitFor(() =>
      expect(
        screen.getByTestId('quotes-status-filter-control').textContent
      ).toBe('PENDING')
    )
    await waitFor(() =>
      expect(quotesApi.getQuotes).toHaveBeenLastCalledWith(
        'tenant-a',
        expect.objectContaining({
          filters: expect.objectContaining({
            'status.value': expect.objectContaining({ value: 'IN_PROGRESS' }),
          }),
        }),
        'main'
      )
    )
  })

  it('gives the approve and decline actions of each row their own test id', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      data: [quote('Q1', 'Acme'), quote('Q2', 'Beta')],
      totalRecords: 2,
    })
    renderTable()
    await waitFor(() => expect(screen.getByText(/of 2$/)).toBeTruthy())

    for (const id of ['Q1', 'Q2']) {
      expect(screen.getAllByTestId(`quote-approve-${id}`)).toHaveLength(1)
      expect(screen.getAllByTestId(`quote-decline-${id}`)).toHaveLength(1)
    }
  })

  // The filters give the other columns 180px and more; without a minimum the
  // table squeezed the company and the quote number instead of scrolling.
  it('keeps the company and quote number columns wide enough to read', async () => {
    renderTable()
    await waitFor(() =>
      expect(rows().some((row) => row.includes('tenant-a-Q1'))).toBe(true)
    )

    const header = (text: string) =>
      screen
        .getAllByRole('columnheader')
        .find((cell) => cell.textContent?.includes(text)) as HTMLElement
    expect(header('Company').style.minWidth).toBe('200px')
    expect(header('Quote number').style.minWidth).toBe('160px')
    expect(header('Quote number').style.whiteSpace).toBe('nowrap')
    expect(
      screen.getByText('tenant-a-Q1').closest('td')?.style.whiteSpace
    ).toBe('nowrap')
  })

  // COP-7116 QA: MD read `price.tax.prices` unchecked, so a line whose price
  // came back without `tax` broke the expanded row.
  it('expands a quote whose line has a price without tax', async () => {
    quotesApi.getQuotes.mockResolvedValue({
      data: [
        {
          ...quote('Q1', 'Acme'),
          items: [
            {
              itemId: 'I1',
              product: { productId: 'P1', name: { en: 'Chair' } },
              quantity: { quantity: 1, unitCode: 'pcs' },
              price: { currency: 'EUR', unitPrice: 10, totalNetValue: 10 },
            },
          ],
        },
      ],
      totalRecords: 1,
    })
    renderTable()
    await waitFor(() => expect(screen.getByText(/of 1$/)).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: /expand/i }))

    const expansion = await screen.findByTestId('quotes-table-expansion')
    expect(within(expansion).getByText('Chair')).toBeTruthy()
    expect(expansion.textContent).not.toMatch(/NaN|undefined/)
  })
})
