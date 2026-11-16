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
import { fetchCatalogs, removeCatalog } from '@emporix/api-calls'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { renderAt } from '../../test/renderWithRouter'
import CatalogsPage from '../../pages/Catalogs.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const configuration = vi.hoisted(() => ({
  saved: [] as { key: string; visible: boolean }[],
  // Stable reference: TableExtensions re-reads its columns when it changes.
  tableConfigurations: [] as unknown[],
  update: vi.fn(),
}))

vi.mock('@emporix/api-calls', () => ({
  fetchCatalogs: vi.fn(),
  fetchCatalog: vi.fn(),
  createNewCatalog: vi.fn(),
  modifyCatalog: vi.fn(),
  removeCatalog: vi.fn(),
}))

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    tableConfigurations: configuration.tableConfigurations,
    fetchTableConfiguration: (key: string) =>
      key === 'ext_catalogs' ? configuration.saved : [],
    fetchVisibleColumns: (key: string) =>
      key === 'ext_catalogs'
        ? configuration.saved.filter((c) => c.visible).map((c) => c.key)
        : [],
    updateTableConfiguration: configuration.update,
  }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const catalogs = [
  {
    id: 'summer',
    name: { en: 'Summer', de: 'Sommer' },
    status: 'visible',
    publishedSites: ['main'],
    visibility: { visible: true, from: '2026-06-01T00:00:00.000Z' },
    metadata: { updatedAt: '2026-05-01T10:00:00.000Z' },
  },
  {
    id: 'winter',
    name: { en: 'Winter' },
    status: 'not_visible',
    publishedSites: ['main', 'de', 'fr'],
    visibility: {},
    metadata: {},
  },
  {
    id: 'draft',
    name: { en: 'Draft' },
    status: 'not_visible',
    publishedSites: [],
    visibility: {},
    metadata: {},
  },
]

const renderList = (tenant = 'tenant-a') =>
  renderAt('/', { list: <CatalogsPage />, detail: <div>detail</div> }, tenant)

const table = () => screen.getByTestId('catalogs-table')

const rowFor = (name: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(name))
  if (!row) throw new Error(`no row for ${name}`)
  return row
}

/** Header text filter inputs, in column order (name, published to). */
const textFilters = () =>
  within(table())
    .getAllByRole('textbox')
    .filter((input) => !input.closest('tbody') && !input.closest('.p-calendar'))

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const confirmDialog = () => screen.getByRole('dialog')

const lastQuery = () =>
  vi.mocked(fetchCatalogs).mock.calls.at(-1)?.[1] as {
    currentPage?: number
    rows?: number
    sortField?: string
    sortOrder?: number | null
    filters?: Record<string, { value: unknown }>
  }

const headers = () =>
  within(table())
    .getAllByRole('columnheader')
    .map((header) => header.textContent ?? '')

describe('Catalogs list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATALOGS_VIEWER,
      EmployeeDomains.CATALOGS_MANAGER,
    ]
    configuration.saved = []
    configuration.update.mockResolvedValue(undefined)
    vi.mocked(fetchCatalogs).mockResolvedValue({
      values: catalogs as never,
      totalRecords: 23,
    })
    vi.mocked(removeCatalog).mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows a page of catalogs with the six MD columns', async () => {
    renderList()

    expect(await screen.findByText('Summer')).toBeTruthy()
    expect(screen.getByText('Winter')).toBeTruthy()
    for (const header of [
      'Visible',
      'Catalog name',
      'Published to',
      'Visibility start',
      'Visibility end',
      'Last published',
    ]) {
      expect(headers().some((text) => text.includes(header))).toBe(true)
    }
    expect(fetchCatalogs).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ currentPage: 1, rows: 10 })
    )
  })

  it('shows one site code, a count for several sites, and a dash for none', async () => {
    renderList()
    await screen.findByText('Summer')

    expect(within(rowFor('Summer')).getByText('main')).toBeTruthy()
    expect(within(rowFor('Winter')).getByText('3 site(s)')).toBeTruthy()
    expect(within(rowFor('Draft')).getByText('-')).toBeTruthy()
  })

  it('reloads with the name filter in the UI language and the site filter', async () => {
    renderList()
    await screen.findByText('Summer')

    fireEvent.change(textFilters()[0], { target: { value: 'Sum' } })
    await waitFor(() =>
      expect(lastQuery().filters?.['name.en']?.value).toBe('Sum')
    )
    expect(lastQuery().currentPage).toBe(1)

    fireEvent.change(textFilters()[1], { target: { value: 'main' } })
    await waitFor(() =>
      expect(lastQuery().filters?.publishedSite?.value).toBe('main')
    )
  })

  it('sends the sort field and order of a sortable column', async () => {
    renderList()
    await screen.findByText('Summer')

    const nameHeader = within(table())
      .getAllByRole('columnheader')
      .find((header) => header.textContent?.includes('Catalog name'))
    if (!nameHeader) throw new Error('no name header')
    fireEvent.click(nameHeader)

    await waitFor(() => expect(lastQuery().sortField).toBe('name'))
    expect(lastQuery().sortOrder).toBe(1)
  })

  it('loads the requested page', async () => {
    renderList()
    await screen.findByText('Summer')

    const next = document.querySelector('.p-paginator-next')
    if (!next) throw new Error('no next-page button')
    fireEvent.click(next)

    await waitFor(() => expect(lastQuery().currentPage).toBe(2))
  })

  it('shows an error toast when the catalogs cannot be loaded', async () => {
    vi.mocked(fetchCatalogs).mockRejectedValue(new Error('boom'))
    renderList()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading catalogs. Please try again later',
        undefined
      )
    )
  })

  it('shows only the columns saved as visible under ext_catalogs', async () => {
    configuration.saved = [
      { key: 'status', visible: false },
      { key: 'name', visible: true },
      { key: 'publishedTo', visible: false },
      { key: 'visibilityStart', visible: false },
      { key: 'visibilityEnd', visible: false },
      { key: 'lastPublished', visible: true },
    ]
    renderList()
    await screen.findByText('Summer')

    const shown = headers().join('|')
    expect(shown).toContain('Catalog name')
    expect(shown).toContain('Last published')
    expect(shown).not.toContain('Published to')
    expect(shown).not.toContain('Visibility start')
  })

  it('saves hidden columns under ext_catalogs with the MD column keys', async () => {
    renderList()
    await screen.findByText('Summer')

    fireEvent.click(screen.getByTestId('table-extensions-open'))
    fireEvent.click(
      within(screen.getByTestId('column-toggle-publishedTo')).getByRole(
        'switch'
      )
    )
    fireEvent.click(screen.getByTestId('table-extensions-save'))

    await waitFor(() => expect(configuration.update).toHaveBeenCalled())
    const [key, config] = configuration.update.mock.calls[0]
    expect(key).toBe('ext_catalogs')
    expect(
      config.table.columns.map((c: { key: string; visible: boolean }) => [
        c.key,
        c.visible,
      ])
    ).toEqual([
      ['status', true],
      ['name', true],
      ['publishedTo', false],
      ['visibilityStart', true],
      ['visibilityEnd', true],
      ['lastPublished', true],
    ])
  })

  it('keeps add, row delete, batch delete and column save disabled for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CATALOGS_VIEWER]
    renderList()
    await screen.findByText('Summer')

    expect(
      (screen.getByTestId('catalogs-create') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (
        within(rowFor('Summer')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)
    fireEvent.click(screen.getByTestId('table-extensions-open'))
    expect(
      (screen.getByTestId('table-extensions-save') as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  it('opens the edit page on row click and from the edit action', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Winter'))
    expect(screen.getByTestId('location').textContent).toBe('/winter')

    cleanup()
    renderList()
    await screen.findByText('Summer')
    fireEvent.click(
      within(rowFor('Summer')).getByRole('button', { name: 'Edit' })
    )
    expect(screen.getByTestId('location').textContent).toBe('/summer')
  })

  it('opens the add page from the add button', async () => {
    renderList()
    await screen.findByText('Summer')
    fireEvent.click(screen.getByTestId('catalogs-create'))

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  it('deletes one catalog after confirmation and reloads the table', async () => {
    renderList()
    await screen.findByText('Summer')

    fireEvent.click(
      within(rowFor('Summer')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(removeCatalog).toHaveBeenCalledWith('tenant-a', 'summer')
    )
    await waitFor(() => expect(fetchCatalogs).toHaveBeenCalledTimes(2))
  })

  it('deletes nothing when the confirmation is cancelled', async () => {
    renderList()
    await screen.findByText('Summer')

    fireEvent.click(
      within(rowFor('Summer')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Cancel' })
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(removeCatalog).not.toHaveBeenCalled()
  })

  it('batch deletes the selected catalogs, clears the selection and reloads', async () => {
    renderList()
    await screen.findByText('Summer')

    fireEvent.click(within(rowFor('Summer')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Draft')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')
    fireEvent.click(batchDeleteButton())
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() => expect(removeCatalog).toHaveBeenCalledTimes(2))
    expect(removeCatalog).toHaveBeenCalledWith('tenant-a', 'summer')
    expect(removeCatalog).toHaveBeenCalledWith('tenant-a', 'draft')
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    await waitFor(() => expect(fetchCatalogs).toHaveBeenCalledTimes(2))
  })

  it('names the id in an error toast when a delete fails', async () => {
    vi.mocked(removeCatalog).mockRejectedValue(new Error('boom'))
    renderList()
    await screen.findByText('Summer')

    fireEvent.click(
      within(rowFor('Summer')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while deleting catalog summer',
        undefined
      )
    )
  })

  it('opens and deletes a catalog whose id needs URL encoding', async () => {
    vi.mocked(fetchCatalogs).mockResolvedValue({
      values: [{ ...catalogs[0], id: 'a/b', name: { en: 'Slash' } }] as never,
      totalRecords: 1,
    })
    renderList()
    await screen.findByText('Slash')

    fireEvent.click(
      within(rowFor('Slash')).getByRole('button', { name: 'Delete' })
    )
    fireEvent.click(
      within(confirmDialog()).getByRole('button', { name: 'Yes' })
    )
    await waitFor(() =>
      expect(removeCatalog).toHaveBeenCalledWith('tenant-a', 'a%2Fb')
    )

    fireEvent.click(screen.getByText('Slash'))
    expect(screen.getByTestId('location').textContent).toBe('/a%2Fb')
  })

  it('drops the selection and the rows when the host switches tenant', async () => {
    const { switchTenant } = renderList('tenant-a')
    await screen.findByText('Summer')
    fireEvent.click(within(rowFor('Summer')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (1)')

    vi.mocked(fetchCatalogs).mockReturnValue(new Promise(() => {}))
    switchTenant('tenant-b')

    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
    expect(screen.queryByText('Summer')).toBeNull()
    expect(fetchCatalogs).toHaveBeenLastCalledWith(
      'tenant-b',
      expect.anything()
    )
  })
})
