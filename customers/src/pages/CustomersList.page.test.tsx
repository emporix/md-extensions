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
import CustomersListPage from './CustomersList.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const api = vi.hoisted(() => ({
  syncCustomers: vi.fn(),
  deleteCustomer: vi.fn(),
}))
const config = vi.hoisted(() => ({
  columns: [] as { key: string; label: string; visible: boolean }[],
  fetchTableConfiguration: vi.fn(),
  getTableMixinColumns: vi.fn(),
  updateTableConfiguration: vi.fn(),
  tableConfigurations: [] as unknown[],
  mixinColumns: { mixinColumns: [] as unknown[] },
}))

vi.mock('../hooks/api/customers', () => ({
  useCustomerApi: () => api,
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

const customers = [
  {
    id: 'C-1',
    firstName: 'Ann',
    lastName: 'Archer',
    contactEmail: 'ann@example.com',
    preferredSite: 'main',
  },
  {
    id: 'C-2',
    firstName: 'Bob',
    lastName: 'Baker',
    contactEmail: 'bob@example.com',
    preferredSite: 'outlet',
  },
]

const renderList = () =>
  renderAt(
    '/',
    { list: <CustomersListPage />, detail: <div>detail</div> },
    'tnt'
  )

const table = () => screen.getByTestId('customers-table')

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
    name: i18n.t('customers.createCustomer'),
  }) as HTMLButtonElement

const rowButton = (text: string, name: string) =>
  within(rowFor(text)).getByRole('button', { name }) as HTMLButtonElement

const confirm = () =>
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  )

describe('Customers list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CUSTOMERS_VIEWER,
      EmployeeDomains.CUSTOMERS_MANAGER,
    ]
    config.columns = []
    config.fetchTableConfiguration.mockImplementation(() => config.columns)
    config.getTableMixinColumns.mockReturnValue([])
    config.updateTableConfiguration.mockResolvedValue(undefined)
    api.syncCustomers.mockResolvedValue({ values: customers, totalRecords: 2 })
    api.deleteCustomer.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    api.syncCustomers.mockReset()
    api.deleteCustomer.mockReset()
  })

  // Scenario 2
  it('lists customers newest first, 10 per page', async () => {
    renderList()

    expect(await screen.findByText('Ann')).toBeTruthy()
    expect(screen.getByText('Archer')).toBeTruthy()
    expect(screen.getByText('ann@example.com')).toBeTruthy()
    expect(screen.getByText('outlet')).toBeTruthy()
    expect(api.syncCustomers.mock.calls[0][0]).toMatchObject({
      currentPage: 1,
      rows: 10,
      sortField: 'metadataCreatedAt',
      sortOrder: -1,
    })
  })

  it('shows every MD column header', async () => {
    renderList()
    await screen.findByText('Ann')

    for (const key of [
      'id',
      'firstName',
      'lastName',
      'contactEmail',
      'preferredSite',
    ]) {
      expect(
        within(table()).getAllByText(i18n.t(`customers.table.columns.${key}`))
          .length
      ).toBeGreaterThan(0)
    }
  })

  it('hides a column the user switched off', async () => {
    config.columns = [
      { key: 'contactEmail', label: 'Contact email', visible: false },
    ]
    renderList()
    await screen.findByText('Ann')

    expect(screen.queryByText('ann@example.com')).toBeNull()
  })

  it('reads and saves the column visibility under ext_customers', async () => {
    renderList()
    await screen.findByText('Ann')

    expect(config.fetchTableConfiguration).toHaveBeenCalledWith('ext_customers')
    expect(config.getTableMixinColumns).toHaveBeenCalledWith('ext_customers')

    fireEvent.click(screen.getByTestId('table-extensions-open'))
    fireEvent.click(await screen.findByTestId('table-extensions-save'))

    await waitFor(() =>
      expect(config.updateTableConfiguration).toHaveBeenCalledWith(
        'ext_customers',
        expect.objectContaining({
          table: expect.objectContaining({
            columns: expect.arrayContaining([
              expect.objectContaining({ key: 'firstName', visible: true }),
            ]),
          }),
        })
      )
    )
  })

  it('sends a column filter to the service', async () => {
    renderList()
    await screen.findByText('Ann')
    const filterInputs = within(table()).getAllByRole('textbox')
    fireEvent.change(filterInputs[1], { target: { value: 'Ann' } })

    await waitFor(() =>
      expect(api.syncCustomers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            firstName: expect.objectContaining({ value: 'Ann' }),
          }),
        })
      )
    )
  })

  it('keeps the list empty when the service rejects', async () => {
    api.syncCustomers.mockRejectedValue('no permissions')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderList()

    await waitFor(() => expect(api.syncCustomers).toHaveBeenCalled())
    expect(screen.queryByText('Ann')).toBeNull()
  })

  it('refetches when the host switches the tenant', async () => {
    const { switchTenant } = renderList()
    await screen.findByText('Ann')
    api.syncCustomers.mockResolvedValue({
      values: [{ ...customers[1], id: 'O-1', firstName: 'Olga' }],
      totalRecords: 1,
    })
    switchTenant('other')

    expect(await screen.findByText('Olga')).toBeTruthy()
    expect(screen.queryByText('Ann')).toBeNull()
  })

  // Scenario 3
  it('opens the customer on row click', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Ann'))

    expect(screen.getByTestId('location').textContent).toBe('/C-1')
  })

  it('opens the customer from the edit action', async () => {
    renderList()
    await screen.findByText('Ann')
    fireEvent.click(rowButton('Bob', 'Edit'))

    expect(screen.getByTestId('location').textContent).toBe('/C-2')
  })

  it('opens the add page from the add button', async () => {
    renderList()
    await screen.findByText('Ann')
    fireEvent.click(addButton())

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  // Scenario 4
  it('deletes one customer after confirmation and reloads the list', async () => {
    renderList()
    await screen.findByText('Ann')

    fireEvent.click(rowButton('Ann', 'Delete'))
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('customers.toasts.successDelete')
      )
    )
    expect(api.deleteCustomer).toHaveBeenCalledWith('C-1')
    await waitFor(() => expect(api.syncCustomers).toHaveBeenCalledTimes(2))
  })

  it('shows an error toast when a row delete fails', async () => {
    api.deleteCustomer.mockRejectedValue(new Error('nope'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderList()
    await screen.findByText('Ann')

    fireEvent.click(rowButton('Ann', 'Delete'))
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('customers.toasts.errorDelete')
      )
    )
  })

  it('batch deletes the selected customers and clears the selection', async () => {
    renderList()
    await screen.findByText('Ann')
    fireEvent.click(within(rowFor('Ann')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Bob')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')

    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('customers.toasts.successDelete')
      )
    )
    expect(api.deleteCustomer).toHaveBeenCalledWith('C-1')
    expect(api.deleteCustomer).toHaveBeenCalledWith('C-2')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    await waitFor(() => expect(api.syncCustomers).toHaveBeenCalledTimes(2))
  })

  it('shows an error toast when a batch delete fails', async () => {
    api.deleteCustomer.mockRejectedValue(new Error('nope'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderList()
    await screen.findByText('Ann')
    fireEvent.click(within(rowFor('Ann')).getByRole('checkbox'))
    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        i18n.t('customers.toasts.errorDelete')
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
  })

  // Scenario 14 (list)
  it('keeps add, row delete and batch delete unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CUSTOMERS_VIEWER]
    renderList()
    await screen.findByText('Ann')

    expect(addButton().disabled).toBe(true)
    expect(rowButton('Ann', 'Delete').disabled).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })
})
