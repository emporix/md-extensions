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
import { deleteUnitCall, getAllUnitsPaginatedCall } from '@emporix/api-calls'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { renderAt } from '../../test/renderWithRouter'
import UnitsPage from '../../pages/Units.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls', () => ({
  getAllUnitsPaginatedCall: vi.fn(),
  getUnitByCodeCall: vi.fn(),
  getAllUnitTypesCall: vi.fn(),
  createUnitCall: vi.fn(),
  updateUnitCall: vi.fn(),
  deleteUnitCall: vi.fn(),
}))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const units = [
  {
    code: 'kg',
    name: { en: 'Kilogram', de: 'Kilogramm' },
    symbol: 'kg',
    type: 'mass',
    baseUnit: true,
    factor: 1,
  },
  {
    code: 'g',
    name: { en: 'Gram' },
    symbol: 'g',
    type: 'mass',
    baseUnit: false,
    factor: 0.001,
  },
  {
    code: 'l',
    name: { en: 'Litre' },
    symbol: 'l',
    type: 'volume',
    baseUnit: true,
    factor: 1,
  },
]

const renderList = (tenant = 'tenant-a') =>
  renderAt('/', { list: <UnitsPage />, detail: <div>detail</div> }, tenant)

const table = () => screen.getByTestId('units-table')

const rowFor = (name: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(name))
  if (!row) throw new Error(`no row for ${name}`)
  return row
}

/** Header filter inputs, in column order (code, name, symbol, type). */
const filterInputs = () =>
  within(table())
    .getAllByRole('textbox')
    .filter((input) => !input.closest('tbody'))

/** The toolbar batch-delete button (row buttons are also named Delete). */
const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const confirmDialog = () => screen.getByRole('dialog')

const lastQuery = () =>
  vi.mocked(getAllUnitsPaginatedCall).mock.calls.at(-1)?.[0] as {
    currentPage?: number
    rows?: number
    filters?: Record<string, { value: unknown }>
  }

describe('Units list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.UNITS_VIEWER,
      EmployeeDomains.UNITS_MANAGER,
    ]
    vi.mocked(getAllUnitsPaginatedCall).mockResolvedValue({
      values: units as never,
      totalRecords: 23,
    })
    vi.mocked(deleteUnitCall).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows a page of units with code, name, symbol, type and factor', async () => {
    renderList()

    expect(await screen.findByText('Kilogram')).toBeTruthy()
    expect(screen.getByText('Gram')).toBeTruthy()
    expect(screen.getByText('Litre')).toBeTruthy()
    expect(screen.getAllByText('mass')).toHaveLength(2)
    expect(screen.getByText('0.001')).toBeTruthy()
    for (const header of ['Code', 'Name', 'Symbol', 'Type', 'Factor']) {
      expect(screen.getByText(header)).toBeTruthy()
    }
    expect(getAllUnitsPaginatedCall).toHaveBeenCalledWith(
      expect.objectContaining({ currentPage: 1, rows: 10 }),
      'tenant-a'
    )
  })

  it('reloads the table with the code filter from the service', async () => {
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.change(filterInputs()[0], { target: { value: 'k' } })

    await waitFor(() => expect(lastQuery().filters?.code?.value).toBe('k'))
    expect(lastQuery().currentPage).toBe(1)
  })

  it('filters by name in the content language, symbol and type', async () => {
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.change(filterInputs()[1], { target: { value: 'Kilo' } })
    await waitFor(() =>
      expect(lastQuery().filters?.['name.en']?.value).toBe('Kilo')
    )
    fireEvent.change(filterInputs()[2], { target: { value: 'l' } })
    await waitFor(() => expect(lastQuery().filters?.symbol?.value).toBe('l'))
    fireEvent.change(filterInputs()[3], { target: { value: 'vol' } })
    await waitFor(() => expect(lastQuery().filters?.type?.value).toBe('vol'))
  })

  it('loads the requested page', async () => {
    renderList()
    await screen.findByText('Kilogram')

    const next = document.querySelector('.p-paginator-next')
    if (!next) throw new Error('no next-page button')
    fireEvent.click(next)

    await waitFor(() => expect(lastQuery().currentPage).toBe(2))
  })

  it('shows an error toast when the units cannot be loaded', async () => {
    vi.mocked(getAllUnitsPaginatedCall).mockRejectedValue(new Error('boom'))
    renderList()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading units. Please try again later',
        undefined
      )
    )
  })

  it('keeps add, row delete and batch delete disabled for a viewer', async () => {
    permissions.granted = [EmployeeDomains.UNITS_VIEWER]
    renderList()
    await screen.findByText('Kilogram')

    expect(
      (screen.getByTestId('units-create') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (
        within(rowFor('Kilogram')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
  })

  it('opens the edit page on row click', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Litre'))

    expect(screen.getByTestId('location').textContent).toBe('/l')
  })

  it('opens the edit page from the row edit action', async () => {
    renderList()
    await screen.findByText('Gram')

    fireEvent.click(
      within(rowFor('Gram')).getByRole('button', { name: 'Edit' })
    )

    expect(screen.getByTestId('location').textContent).toBe('/g')
  })

  it('opens the add page from the add button', async () => {
    renderList()
    await screen.findByText('Kilogram')
    fireEvent.click(screen.getByTestId('units-create'))

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  it('deletes one unit after confirmation and reloads the table', async () => {
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.click(
      within(rowFor('Kilogram')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(deleteUnitCall).toHaveBeenCalledWith('tenant-a', 'kg')
    )
    await waitFor(() =>
      expect(getAllUnitsPaginatedCall).toHaveBeenCalledTimes(2)
    )
  })

  it('opens and deletes a unit whose code needs URL encoding', async () => {
    vi.mocked(getAllUnitsPaginatedCall).mockResolvedValue({
      values: [{ ...units[0], code: 'km/h', name: { en: 'Speed' } }] as never,
      totalRecords: 1,
    })
    renderList()
    await screen.findByText('Speed')

    fireEvent.click(
      within(rowFor('Speed')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )
    await waitFor(() =>
      expect(deleteUnitCall).toHaveBeenCalledWith('tenant-a', 'km%2Fh')
    )

    fireEvent.click(screen.getByText('Speed'))
    expect(screen.getByTestId('location').textContent).toBe('/km%2Fh')
  })

  it('deletes nothing when the confirmation is cancelled', async () => {
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.click(
      within(rowFor('Kilogram')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' })
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(deleteUnitCall).not.toHaveBeenCalled()
  })

  it('batch deletes the selected units, clears the selection and reloads', async () => {
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.click(within(rowFor('Kilogram')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Litre')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')
    fireEvent.click(batchDeleteButton())
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() => expect(deleteUnitCall).toHaveBeenCalledTimes(2))
    expect(deleteUnitCall).toHaveBeenCalledWith('tenant-a', 'kg')
    expect(deleteUnitCall).toHaveBeenCalledWith('tenant-a', 'l')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    await waitFor(() =>
      expect(getAllUnitsPaginatedCall).toHaveBeenCalledTimes(2)
    )
  })

  it('names the code in an error toast when a delete fails', async () => {
    vi.mocked(deleteUnitCall).mockRejectedValue(new Error('boom'))
    renderList()
    await screen.findByText('Kilogram')

    fireEvent.click(
      within(rowFor('Kilogram')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while deleting unit kg',
        undefined
      )
    )
  })

  it('drops the selection and the rows when the host switches tenant', async () => {
    const { switchTenant } = renderList('tenant-a')
    await screen.findByText('Kilogram')
    fireEvent.click(within(rowFor('Kilogram')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (1)')

    vi.mocked(getAllUnitsPaginatedCall).mockReturnValue(new Promise(() => {}))
    switchTenant('tenant-b')

    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    expect(screen.queryByText('Kilogram')).toBeNull()
    expect(getAllUnitsPaginatedCall).toHaveBeenLastCalledWith(
      expect.anything(),
      'tenant-b'
    )
    expect(deleteUnitCall).not.toHaveBeenCalled()
  })
})
