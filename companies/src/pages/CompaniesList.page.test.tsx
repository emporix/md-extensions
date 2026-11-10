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
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import CompaniesListPage from './CompaniesList.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const api = vi.hoisted(() => ({
  getLegalEntities: vi.fn(),
  deleteLegalEntity: vi.fn(),
}))
const config = vi.hoisted(() => ({
  columns: [] as { key: string; label: string; visible: boolean }[],
  fetchTableConfiguration: vi.fn(),
  getTableMixinColumns: vi.fn(),
  updateTableConfiguration: vi.fn(),
  // Stable references: TableExtensions re-reads the configuration whenever
  // these change identity, so fresh arrays per render would loop.
  tableConfigurations: [] as unknown[],
  mixinColumns: { mixinColumns: [] as unknown[] },
}))

vi.mock('../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => api,
}))

vi.mock('../hooks/useMixinColumns', () => ({
  useMixinColumns: () => config.mixinColumns,
}))

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    tableConfigurations: config.tableConfigurations,
    fetchTableConfiguration: config.fetchTableConfiguration,
    getTableMixinColumns: config.getTableMixinColumns,
    updateTableConfiguration: config.updateTableConfiguration,
    contentLanguage: 'en',
    languages: [],
    currencies: [],
  }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const companies = [
  {
    id: 'C-1',
    name: 'Acme',
    type: 'COMPANY',
    legalInfo: { countryOfRegistration: 'DE', legalName: 'Acme GmbH' },
    contacts: [
      { id: 'a1', primary: false, customer: { name: 'Bob', surname: 'B' } },
      { id: 'a2', primary: true, customer: { name: 'Ann', surname: 'A' } },
    ],
    customerGroups: [],
  },
  {
    id: 'C-2',
    name: 'Beta',
    type: 'SUBSIDIARY',
    legalInfo: { countryOfRegistration: 'PL', legalName: 'Beta Sp' },
    contacts: [],
    customerGroups: [],
  },
]

const renderList = () =>
  renderAt(
    '/',
    { list: <CompaniesListPage />, detail: <div>detail</div> },
    'tnt'
  )

const table = () => screen.getByTestId('companies-table')

const rowFor = (text: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(text))
  if (!row) throw new Error(`no row for ${text}`)
  return row
}

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const addButton = () =>
  screen.getByRole('button', {
    name: i18n.t('companies.addNewCompany'),
  }) as HTMLButtonElement

const confirm = () =>
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  )

describe('Companies list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.COMPANIES_VIEWER,
      EmployeeDomains.COMPANIES_MANAGER,
    ]
    config.columns = []
    config.fetchTableConfiguration.mockImplementation(() => config.columns)
    config.getTableMixinColumns.mockReturnValue([])
    config.updateTableConfiguration.mockResolvedValue(undefined)
    api.getLegalEntities.mockResolvedValue({
      values: companies,
      totalRecords: 2,
    })
    api.deleteLegalEntity.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    api.getLegalEntities.mockReset()
    api.deleteLegalEntity.mockReset()
  })

  // S1
  it('renders the companies from the API with the default columns', async () => {
    renderList()

    expect(await screen.findByText('Acme')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
    expect(screen.getByText('C-1')).toBeTruthy()
    expect(screen.getByText('DE')).toBeTruthy()
    // The primary contact wins over the first one; no contacts shows "-".
    expect(within(rowFor('Acme')).getByText('Ann A')).toBeTruthy()
    expect(within(rowFor('Beta')).getByText('-')).toBeTruthy()
    // Columns hidden by default in MD stay hidden until configured.
    expect(screen.queryByText('Acme GmbH')).toBeNull()
    expect(
      within(table()).queryByText(i18n.t('companies.legalName'))
    ).toBeNull()
    expect(api.getLegalEntities.mock.calls[0][0]).toMatchObject({
      currentPage: 1,
      rows: 10,
    })
  })

  it('shows a saved hidden-by-default column', async () => {
    config.columns = [{ key: 'legalName', label: 'Legal name', visible: true }]
    renderList()

    expect(await screen.findByText('Acme GmbH')).toBeTruthy()
  })

  it('opens the company on row click', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Acme'))

    expect(screen.getByTestId('location').textContent).toBe('/C-1')
  })

  it('opens the add page from the add button', async () => {
    renderList()
    await screen.findByText('Acme')
    fireEvent.click(addButton())

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  it('shows a toast when the list cannot be loaded', async () => {
    api.getLegalEntities.mockRejectedValue({
      response: { data: { message: 'boom' } },
    })
    renderList()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('companies.toasts.errorLoad'),
        'boom'
      )
    )
  })

  it('refetches when the host switches the tenant', async () => {
    const { switchTenant } = renderList()
    await screen.findByText('Acme')
    api.getLegalEntities.mockResolvedValue({
      values: [{ ...companies[1], id: 'O-1', name: 'Other' }],
      totalRecords: 1,
    })
    switchTenant('other')

    expect(await screen.findByText('Other')).toBeTruthy()
    expect(screen.queryByText('Acme')).toBeNull()
  })

  // S2
  it('saves the column visibility under ext_companies', async () => {
    renderList()
    await screen.findByText('Acme')

    expect(config.fetchTableConfiguration).toHaveBeenCalledWith('ext_companies')
    expect(config.getTableMixinColumns).toHaveBeenCalledWith('ext_companies')

    fireEvent.click(screen.getByTestId('table-extensions-open'))
    await screen.findByTestId('column-toggle-legalName')
    expect(
      (document.getElementById('column-legalName') as HTMLInputElement).checked
    ).toBe(false)
    fireEvent.click(await screen.findByTestId('table-extensions-save'))

    await waitFor(() =>
      expect(config.updateTableConfiguration).toHaveBeenCalledWith(
        'ext_companies',
        expect.objectContaining({
          table: expect.objectContaining({
            columns: expect.arrayContaining([
              expect.objectContaining({ key: 'name', visible: true }),
              // Default-hidden columns stay hidden when saved unchanged (MD).
              expect.objectContaining({ key: 'modifiedAt', visible: false }),
              expect.objectContaining({ key: 'legalName', visible: false }),
            ]),
          }),
        })
      )
    )
  })

  // S3
  it('keeps add, row delete and batch delete unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.COMPANIES_VIEWER]
    renderList()
    await screen.findByText('Acme')

    expect(addButton().disabled).toBe(true)
    expect(
      (
        within(rowFor('Acme')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })

  it('enables add and row delete for a manager', async () => {
    renderList()
    await screen.findByText('Acme')

    expect(addButton().disabled).toBe(false)
    expect(
      (
        within(rowFor('Acme')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
  })

  // S7
  it('deletes one company after confirmation and refreshes the list', async () => {
    renderList()
    await screen.findByText('Acme')

    fireEvent.click(
      within(rowFor('Acme')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('companies.toast.delete.title')
      )
    )
    expect(api.deleteLegalEntity).toHaveBeenCalledWith('C-1')
    await waitFor(() => expect(api.getLegalEntities).toHaveBeenCalledTimes(2))
  })

  it('shows the API error when a row delete fails', async () => {
    api.deleteLegalEntity.mockRejectedValue({
      response: { data: { details: 'has subsidiaries' } },
    })
    renderList()
    await screen.findByText('Acme')

    fireEvent.click(
      within(rowFor('Acme')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('companies.toasts.errorDelete'),
        'has subsidiaries'
      )
    )
  })

  it('batch deletes the selected companies and clears the selection', async () => {
    renderList()
    await screen.findByText('Acme')
    fireEvent.click(within(rowFor('Acme')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Beta')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')

    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('companies.toast.delete.title')
      )
    )
    expect(api.deleteLegalEntity).toHaveBeenCalledWith('C-1')
    expect(api.deleteLegalEntity).toHaveBeenCalledWith('C-2')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    await waitFor(() => expect(api.getLegalEntities).toHaveBeenCalledTimes(2))
  })

  it('shows an error toast when a batch delete fails', async () => {
    api.deleteLegalEntity.mockRejectedValue({
      response: { data: { message: 'nope' } },
    })
    renderList()
    await screen.findByText('Acme')
    fireEvent.click(within(rowFor('Acme')).getByRole('checkbox'))
    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('companies.toasts.errorDelete'),
        'nope'
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
  })
})
