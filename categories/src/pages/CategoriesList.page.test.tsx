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
import {
  CategoryType,
  deleteSingleCategory,
  getCategories,
  getCategoryParentsCall,
  getCategoryTreesCall,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import CategoriesListPage from './CategoriesList.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const tableConfig = vi.hoisted(() => ({
  columns: [] as { key: string; label: string; visible: boolean }[],
  mixins: [] as unknown[],
  // A new array after each save, as the provider reloads the configuration.
  configurations: [] as unknown[],
  fetchTableConfiguration: vi.fn(),
  getTableMixinColumns: vi.fn(),
  updateTableConfiguration: vi.fn(),
}))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    getCategories: vi.fn(),
    deleteSingleCategory: vi.fn(),
    getCategoryParentsCall: vi.fn(),
    rebuildCategoryTreeCall: vi.fn(),
    getCategoryTreesCall: vi.fn(),
  }
})

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    tableConfigurations: tableConfig.configurations,
    fetchTableConfiguration: tableConfig.fetchTableConfiguration,
    getTableMixinColumns: tableConfig.getTableMixinColumns,
    updateTableConfiguration: tableConfig.updateTableConfiguration,
    contentLanguage: 'en',
    languages: [{ id: 'en' }],
    currencies: [],
  }),
}))

// The tenant's category mixins offered as extra columns.
vi.mock('../hooks/useMixinColumns', () => ({
  useMixinColumns: () => ({
    mixinColumns: [
      { key: 'seo.title', label: { en: 'SEO title' }, type: 'TEXT' },
    ],
  }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const category = (id: string, name: string, extra: object = {}) => ({
  id,
  code: id.toUpperCase(),
  localizedName: { en: name },
  localizedSlug: { en: id },
  published: true,
  position: 0,
  validity: {},
  ...extra,
})

const categories = [
  category('shoes', 'Shoes', { parentId: 'clothes' }),
  category('shirts', 'Shirts', { parentId: 'clothes', published: false }),
]

const renderList = (path = '/', options?: { hashRouter?: boolean }) =>
  renderAt(
    path,
    { list: <CategoriesListPage />, detail: <div /> },
    'tnt',
    options
  )

const table = () => screen.getByTestId('categories-table')

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

const confirm = () =>
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  )

describe('Categories list', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    tableConfig.columns = []
    tableConfig.mixins = []
    tableConfig.configurations = []
    tableConfig.fetchTableConfiguration.mockImplementation(
      () => tableConfig.columns
    )
    tableConfig.getTableMixinColumns.mockImplementation(
      () => tableConfig.mixins
    )
    tableConfig.updateTableConfiguration.mockImplementation(
      async (
        _key: string,
        { table }: { table: { columns: never[]; mixins: unknown[] } }
      ) => {
        tableConfig.columns = table.columns
        tableConfig.mixins = table.mixins
        tableConfig.configurations = [{ key: 'ext_categories' }]
      }
    )
    vi.mocked(getCategories).mockResolvedValue({
      values: categories as never,
      totalRecords: 12,
    })
    vi.mocked(deleteSingleCategory).mockResolvedValue({})
    // Both categories hang below the `clothes` root.
    vi.mocked(getCategoryParentsCall).mockResolvedValue([
      { id: 'clothes' },
    ] as never)
    vi.mocked(rebuildCategoryTreeCall).mockResolvedValue({} as never)
    vi.mocked(getCategoryTreesCall).mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.clearAllMocks()
    vi.mocked(getCategories).mockReset()
    vi.mocked(deleteSingleCategory).mockReset()
  })

  // Scenario 1
  it('pages through the standard categories, unpublished included, with the MD columns', async () => {
    renderList()

    expect(await screen.findByText('Shoes')).toBeTruthy()
    expect(screen.getByText('Shirts')).toBeTruthy()
    expect(screen.getByText('SHOES')).toBeTruthy()
    for (const header of [
      'Id',
      'Published',
      'Category Name',
      'Code',
      'Slug',
      'Valid from',
      'Valid to',
    ]) {
      expect(within(table()).getAllByText(header).length).toBeGreaterThan(0)
    }
    const [tenant, pagination, type, showRoots, showUnpublished] =
      vi.mocked(getCategories).mock.calls[0]
    expect(tenant).toBe('tnt')
    expect(pagination).toMatchObject({ currentPage: 1, rows: 10 })
    expect(type).toBe(CategoryType.STANDARD)
    expect(showRoots).toBe(false)
    expect(showUnpublished).toBe(true)
    // The paginator reports the service total, not the rows on the page.
    expect(within(table()).getByText(/12/)).toBeTruthy()
  })

  it('filters by name', async () => {
    renderList()
    await screen.findByText('Shoes')
    const nameFilter = within(table())
      .getAllByRole('textbox')
      .find((input) => input.closest('th'))
    if (!nameFilter) throw new Error('no name filter')

    fireEvent.change(nameFilter, { target: { value: 'sho' } })

    await waitFor(() =>
      expect(vi.mocked(getCategories).mock.lastCall?.[1]).toMatchObject({
        filters: { localizedName: { value: 'sho', matchMode: 'contains' } },
      })
    )
  })

  // Scenario 2 (a preference saved earlier is honoured)
  it('hides the columns hidden in the ext_categories configuration', async () => {
    tableConfig.columns = [{ key: 'code', label: 'Code', visible: false }]
    renderList()
    await screen.findByText('Shoes')

    expect(tableConfig.fetchTableConfiguration).toHaveBeenCalledWith(
      'ext_categories'
    )
    expect(tableConfig.getTableMixinColumns).toHaveBeenCalledWith(
      'ext_categories'
    )
    expect(screen.queryByText('SHOES')).toBeNull()
    expect(within(table()).queryByText('Code')).toBeNull()
  })

  // Scenario 2
  it('hides a column and adds a mixin column from the table settings', async () => {
    renderList()
    await screen.findByText('Shoes')

    fireEvent.click(screen.getByTestId('categories-table-extensions-open'))
    const panel = await screen.findByTestId('categories-table-extensions-panel')
    fireEvent.click(
      within(panel)
        .getByTestId('categories-table-extensions-toggle-code')
        .querySelector('input') ??
        within(panel).getByTestId('categories-table-extensions-toggle-code')
    )
    fireEvent.click(within(panel).getByRole('combobox'))
    fireEvent.mouseDown(
      await screen.findByRole('option', { name: 'seo.title' })
    )
    expect(await within(panel).findByText('SEO title')).toBeTruthy()
    fireEvent.click(screen.getByTestId('categories-table-extensions-save'))

    await waitFor(() =>
      expect(tableConfig.updateTableConfiguration).toHaveBeenCalledWith(
        'ext_categories',
        {
          table: {
            columns: expect.arrayContaining([
              { key: 'id', label: 'Id', visible: true },
              { key: 'code', label: 'Code', visible: false },
            ]),
            mixins: [
              { key: 'seo.title', label: { en: 'SEO title' }, type: 'TEXT' },
            ],
          },
        }
      )
    )
    await waitFor(() =>
      expect(
        screen.queryByTestId('categories-table-extensions-panel')
      ).toBeNull()
    )
    await waitFor(() => expect(screen.queryByText('SHOES')).toBeNull())
    expect(within(table()).getAllByText('SEO title').length).toBeGreaterThan(0)
  })

  it('keeps the table settings open when saving fails', async () => {
    tableConfig.updateTableConfiguration.mockRejectedValue(new Error('down'))
    renderList()
    await screen.findByText('Shoes')

    fireEvent.click(screen.getByTestId('categories-table-extensions-open'))
    await screen.findByTestId('categories-table-extensions-panel')
    fireEvent.click(screen.getByTestId('categories-table-extensions-save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Failed to save column settings',
        undefined
      )
    )
    expect(screen.getByTestId('categories-table-extensions-panel')).toBeTruthy()
  })

  it('opens a category on row click', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Shoes'))

    expect(screen.getByTestId('location').textContent).toBe('/shoes')
  })

  it('opens the add page from the header button in the list view', async () => {
    renderList()
    await screen.findByText('Shoes')
    fireEvent.click(screen.getByTestId('categories-add'))

    expect(screen.getByTestId('location').textContent).toBe('/add')
  })

  it('keeps the view in the URL when switching to the tree', async () => {
    renderList('/', { hashRouter: true })
    await screen.findByText('Shoes')

    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain('view=tree')
    )
    expect(await screen.findByTestId('categories-tree')).toBeTruthy()
  })

  // Scenario 10
  it('deletes one category with its subcategories and rebuilds its root', async () => {
    renderList()
    await screen.findByText('Shoes')

    fireEvent.click(
      within(rowFor('Shoes')).getByRole('button', { name: 'Delete' })
    )
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('1 categories(s) deleted')
    )
    expect(deleteSingleCategory).toHaveBeenCalledWith('tnt', 'shoes', true)
    expect(getCategoryParentsCall).toHaveBeenCalledWith('tnt', 'shoes', true)
    expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
    await waitFor(() => expect(getCategories).toHaveBeenCalledTimes(2))
  })

  it('bulk deletes the selected categories', async () => {
    renderList()
    await screen.findByText('Shoes')
    fireEvent.click(within(rowFor('Shoes')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Shirts')).getByRole('checkbox'))
    expect(batchDeleteButton().textContent).toBe('Delete (2)')

    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('2 categories(s) deleted')
    )
    expect(deleteSingleCategory).toHaveBeenCalledWith('tnt', 'shoes', true)
    expect(deleteSingleCategory).toHaveBeenCalledWith('tnt', 'shirts', true)
    // One rebuild for the shared root.
    expect(rebuildCategoryTreeCall).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(batchDeleteButton().textContent).toBe('Delete'))
  })

  it('names the category that could not be deleted in one error toast', async () => {
    vi.mocked(deleteSingleCategory).mockImplementation(async (_t, id) => {
      if (id === 'shirts') throw new Error('in use')
      return {}
    })
    renderList()
    await screen.findByText('Shoes')
    fireEvent.click(within(rowFor('Shoes')).getByRole('checkbox'))
    fireEvent.click(within(rowFor('Shirts')).getByRole('checkbox'))
    fireEvent.click(batchDeleteButton())
    confirm()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Failed to delete category Shirts'
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
    // The failed category stays selected.
    await waitFor(() =>
      expect(batchDeleteButton().textContent).toBe('Delete (1)')
    )
  })

  // Requirement 11
  it('keeps add, row delete and batch delete unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    renderList()
    await screen.findByText('Shoes')

    expect(
      (screen.getByTestId('categories-add') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(
      (
        within(rowFor('Shoes')).getByRole('button', {
          name: 'Delete',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    expect(batchDeleteButton().disabled).toBe(true)

    fireEvent.click(screen.getByTestId('categories-table-extensions-open'))
    await screen.findByTestId('categories-table-extensions-panel')
    expect(
      (
        screen.getByTestId(
          'categories-table-extensions-save'
        ) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })
})
