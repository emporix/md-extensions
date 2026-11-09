/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { fetchCoupons, removeCoupon } from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import CouponsPage from './Coupons.page'
import tableStyles from '../components/coupons/CouponsTable.module.scss'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const tableConfig = vi.hoisted(() => ({
  columns: [] as { key: string; visible: boolean }[],
  fetchTableConfiguration: vi.fn(),
  getTableMixinColumns: vi.fn(),
}))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchCoupons: vi.fn(),
    removeCoupon: vi.fn(),
  }
})

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    tableConfigurations: [],
    fetchTableConfiguration: tableConfig.fetchTableConfiguration,
    getTableMixinColumns: tableConfig.getTableMixinColumns,
    contentLanguage: 'en',
    languages: [],
    currencies: [],
  }),
}))

// The Columns panel has its own tests in the copied remotes; it is not part of
// the list contract under test here.
vi.mock('../components/shared/TableExtensions', () => ({
  default: ({ tableConfigurationKey }: { tableConfigurationKey: string }) => (
    <div data-testid="table-extensions">{tableConfigurationKey}</div>
  ),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const coupons = [
  {
    code: 'SALE10',
    name: 'Ten percent',
    discountType: 'PERCENT',
    discountPercentage: 10,
    redemptionCount: 3,
    categoryRestricted: false,
  },
  {
    code: 'FIVE',
    name: 'Five off',
    discountType: 'ABSOLUTE',
    discountAbsolute: { amount: 5, currency: 'EUR' },
    redemptionCount: 0,
    categoryRestricted: true,
  },
  {
    code: 'SHIP',
    name: 'Free delivery',
    discountType: 'FREE_SHIPPING',
    categoryRestricted: false,
  },
]

const renderList = () =>
  renderAt('/', { list: <CouponsPage />, detail: <div>detail</div> }, 'tnt')

const table = () => screen.getByTestId('coupons-table')

const rowFor = (code: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(code))
  if (!row) throw new Error(`no row for ${code}`)
  return row
}

const confirmDialog = () => screen.getByRole('dialog')

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

describe('Coupons list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.COUPONS_VIEWER,
      EmployeeDomains.COUPONS_MANAGER,
    ]
    tableConfig.columns = []
    tableConfig.fetchTableConfiguration.mockImplementation(
      () => tableConfig.columns
    )
    tableConfig.getTableMixinColumns.mockReturnValue([])
    vi.mocked(fetchCoupons).mockResolvedValue({
      values: coupons as never,
      totalRecords: 23,
    })
    vi.mocked(removeCoupon).mockResolvedValue({} as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.mocked(fetchCoupons).mockReset()
    vi.mocked(removeCoupon).mockReset()
  })

  // Scenario 1
  it('pages through the coupons of the tenant with the MD columns', async () => {
    renderList()

    expect(await screen.findByText('SALE10')).toBeTruthy()
    expect(screen.getByText('FIVE')).toBeTruthy()
    expect(screen.getByText('Ten percent')).toBeTruthy()
    expect(screen.getByText('Percent')).toBeTruthy()
    expect(screen.getByText('Amount')).toBeTruthy()
    expect(screen.getByText('Free shipping')).toBeTruthy()
    expect(screen.getByText('10%')).toBeTruthy()
    for (const header of [
      'Code',
      'Name',
      'Discount type',
      'Discount percentage',
      'Discount amount',
      'Redemption count',
      'Category coupon',
    ]) {
      expect(within(table()).getAllByText(header).length).toBeGreaterThan(0)
    }
    expect(vi.mocked(fetchCoupons).mock.calls[0][0]).toBe('tnt')
    expect(vi.mocked(fetchCoupons).mock.calls[0][1]).toMatchObject({
      currentPage: 1,
      rows: 10,
    })
    // The paginator reports the service total, not the rows on the page.
    expect(within(table()).getByText(/23/)).toBeTruthy()
  })

  it('shows a toast when the list cannot be loaded', async () => {
    vi.mocked(fetchCoupons).mockRejectedValue(new Error('boom'))
    renderList()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading coupons'
      )
    )
  })

  it('filters by discount type and clears the filter with the × button', async () => {
    renderList()
    await screen.findByText('SALE10')
    const [discountTypeFilter] = within(table()).getAllByRole('combobox')

    fireEvent.click(discountTypeFilter)
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Percent' }))

    await waitFor(() =>
      expect(vi.mocked(fetchCoupons).mock.lastCall?.[1]).toMatchObject({
        filters: { discountType: { value: 'PERCENT' } },
      })
    )

    fireEvent.click(
      within(discountTypeFilter).getByRole('button', { name: 'Clear' })
    )

    // The cleared column filter is dropped from the request.
    await waitFor(() => {
      const filters = (
        vi.mocked(fetchCoupons).mock.lastCall?.[1] as {
          filters?: Record<string, { value?: unknown }>
        }
      ).filters
      expect(filters?.discountType?.value ?? null).toBeNull()
    })
    expect(
      within(discountTypeFilter).queryByRole('button', { name: 'Clear' })
    ).toBeNull()
  })

  it('clears a text column filter with its clear button', async () => {
    renderList()
    await screen.findByText('SALE10')
    const [codeFilter] = within(table()).getAllByRole('textbox')
    const codeFilterCell = codeFilter.closest('th') as HTMLElement

    fireEvent.change(codeFilter, { target: { value: 'SALE' } })
    await waitFor(() =>
      expect(vi.mocked(fetchCoupons).mock.lastCall?.[1]).toMatchObject({
        filters: { code: { value: 'SALE' } },
      })
    )

    fireEvent.click(
      within(codeFilterCell).getByRole('button', { name: 'Clear' })
    )

    await waitFor(() => {
      const filters = (
        vi.mocked(fetchCoupons).mock.lastCall?.[1] as {
          filters?: Record<string, { value?: unknown }>
        }
      ).filters
      expect(filters?.code?.value ?? null).toBeNull()
    })
    expect((codeFilter as HTMLInputElement).value).toBe('')
  })

  it('offers one clear control per filterable column', async () => {
    renderList()
    await screen.findByText('SALE10')
    const headerRow = within(table()).getAllByRole('row')[1]
    // code, name, redemption count: column clear buttons; the two dropdown
    // filters clear through their own × once a value is picked.
    expect(
      within(headerRow).getAllByRole('button', { name: 'Clear' })
    ).toHaveLength(3)
  })

  it('gives the name column its wider minimum width', async () => {
    renderList()
    const nameCell = (await screen.findByText('Ten percent')).closest('td')
    const nameHeader = within(table()).getByText('Name').closest('th')

    expect(nameCell?.classList.contains(tableStyles.nameCell)).toBe(true)
    expect(nameHeader?.classList.contains(tableStyles.nameCell)).toBe(true)
  })

  // Scenario 2
  it('reads column visibility from the ext_coupons configuration', async () => {
    tableConfig.columns = [{ key: 'name', visible: false }]
    renderList()
    await screen.findByText('SALE10')

    expect(tableConfig.fetchTableConfiguration).toHaveBeenCalledWith(
      'ext_coupons'
    )
    expect(tableConfig.getTableMixinColumns).toHaveBeenCalledWith('ext_coupons')
    expect(screen.getByTestId('table-extensions').textContent).toBe(
      'ext_coupons'
    )
    expect(screen.queryByText('Ten percent')).toBeNull()
    expect(within(table()).queryByText('Name')).toBeNull()
  })

  // Scenario 3 (list)
  it('keeps add, row delete and batch delete unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.COUPONS_VIEWER]
    renderList()
    await screen.findByText('SALE10')

    expect(
      (screen.getByTestId('coupons-create') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (
        within(rowFor('SALE10')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })

  it('opens the coupon on row click, encoding the code', async () => {
    vi.mocked(fetchCoupons).mockResolvedValue({
      values: [{ ...coupons[0], code: 'SALE#1' }] as never,
      totalRecords: 1,
    })
    renderList()
    fireEvent.click(await screen.findByText('SALE#1'))

    expect(screen.getByTestId('location').textContent).toBe('/SALE%231')
  })

  it('opens the create page from the add button', async () => {
    renderList()
    await screen.findByText('SALE10')
    fireEvent.click(screen.getByTestId('coupons-create'))

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  // Scenario 13
  it('deletes one coupon after confirmation and refreshes the list', async () => {
    renderList()
    await screen.findByText('SALE10')

    fireEvent.click(
      within(rowFor('SALE10')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Coupon deleted successfully'
      )
    )
    expect(removeCoupon).toHaveBeenCalledWith('tnt', 'SALE10')
    await waitFor(() => expect(fetchCoupons).toHaveBeenCalledTimes(2))
  })

  it('batch deletes the selected coupons and clears the selection', async () => {
    renderList()
    await screen.findByText('SALE10')
    fireEvent.click(within(rowFor('SALE10')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('FIVE')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')

    fireEvent.click(batchDeleteButton())
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Coupons deleted successfully'
      )
    )
    expect(removeCoupon).toHaveBeenCalledWith('tnt', 'SALE10')
    expect(removeCoupon).toHaveBeenCalledWith('tnt', 'FIVE')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
  })

  it('names the failed and the deleted codes in one error toast', async () => {
    vi.mocked(removeCoupon).mockImplementation(async (_tenant, code) => {
      if (code === 'FIVE') {
        throw { response: { data: { message: 'in use' } } }
      }
      return {} as never
    })
    renderList()
    await screen.findByText('SALE10')
    fireEvent.click(within(rowFor('SALE10')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('FIVE')).getByRole('checkbox'))
    fireEvent.click(batchDeleteButton())
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Could not delete coupons: FIVE',
        'FIVE: in use; Deleted: SALE10'
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
  })

  it('steps back a page when the current page came back empty', async () => {
    renderList()
    await screen.findByText('SALE10')
    // Another user deleted the rows of page 2 meanwhile.
    vi.mocked(fetchCoupons)
      .mockResolvedValueOnce({ values: [], totalRecords: 10 })
      .mockResolvedValue({ values: coupons as never, totalRecords: 10 })

    // Prime's page buttons are labelled one page ahead; pick by the shown number.
    const pageTwo = within(table())
      .getAllByRole('button')
      .find((button) => button.textContent === '2')
    if (!pageTwo) throw new Error('no page 2 button')
    fireEvent.click(pageTwo)

    await waitFor(() =>
      expect(vi.mocked(fetchCoupons).mock.lastCall?.[1]).toMatchObject({
        currentPage: 1,
      })
    )
    expect(
      vi
        .mocked(fetchCoupons)
        .mock.calls.some(
          ([, pagination]) =>
            (pagination as { currentPage?: number }).currentPage === 2
        )
    ).toBe(true)
    expect(await screen.findByText('SALE10')).toBeTruthy()
  })

  it('drops the rows and the selection when the host switches tenant', async () => {
    const { switchTenant } = renderList()
    await screen.findByText('SALE10')
    fireEvent.click(within(rowFor('SALE10')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (1)')

    vi.mocked(fetchCoupons).mockReturnValue(new Promise(() => {}))
    switchTenant('other')

    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    expect(screen.queryByText('SALE10')).toBeNull()
    expect(vi.mocked(fetchCoupons).mock.lastCall?.[0]).toBe('other')
  })
})
