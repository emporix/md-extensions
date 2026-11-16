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
  createNewCategory,
  deleteSingleCategory,
  fetchCategory,
  getCategories,
  getCategoryParentsCall,
  getCategoryTreesCall,
  patchCategoryCall,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import ClassificationsListPage from './ClassificationsList.page'

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
    fetchCategory: vi.fn(),
    patchCategoryCall: vi.fn(),
    createNewCategory: vi.fn(),
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

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const classification = (id: string, name: string, extra: object = {}) => ({
  id,
  code: id.toUpperCase(),
  localizedName: { en: name, de: `${name} (de)` },
  published: true,
  position: 0,
  validity: {},
  ...extra,
})

// `material` is a root; the other two hang below the `fit` root.
const classifications = [
  classification('slim', 'Slim', {
    parentId: 'fit',
    validity: { from: '2031-03-05T10:00:00.000Z' },
  }),
  classification('wide', 'Wide', { parentId: 'fit', published: false }),
  classification('material', 'Material'),
]

const treeNode = (
  id: string,
  position: number,
  subcategories: object[] = []
) => ({
  id,
  position,
  published: true,
  code: id.toUpperCase(),
  localizedName: { en: id.charAt(0).toUpperCase() + id.slice(1) },
  subcategories,
})

// fit (0) → slim (0), wide (1); material (1)
const trees = () => [
  treeNode('fit', 0, [treeNode('slim', 0), treeNode('wide', 1)]),
  treeNode('material', 1),
]

const notFound = () =>
  Object.assign(new Error('404'), { response: { status: 404 } })

const renderList = (path = '/', options?: { hashRouter?: boolean }) =>
  renderAt(
    path,
    { list: <ClassificationsListPage />, detail: <div>detail</div> },
    'tnt',
    options
  )

// The pagination keeps page and rows in the live hash, so the tree view, which
// shares the query string with it, is rendered in the real hash router.
const renderTreeView = (path: string) => renderList(path, { hashRouter: true })

const searchParam = (name: string) =>
  new URLSearchParams(screen.getByTestId('search').textContent ?? '').get(name)

const table = () => screen.getByTestId('classifications-table')

const rowFor = (text: string) => {
  const row = within(table())
    .getAllByRole('row')
    .find((r) => within(r).queryByText(text))
  if (!row) throw new Error(`no row for ${text}`)
  return row
}

const rowButton = (rowText: string, name: string) =>
  within(rowFor(rowText)).getByRole('button', { name }) as HTMLButtonElement

const batchDeleteButton = () => {
  const button = screen
    .getAllByRole('button', { name: /^Delete/ })
    .find((b) => !table().contains(b))
  if (!button) throw new Error('no batch delete button')
  return button as HTMLButtonElement
}

const addButton = () =>
  screen.getByTestId('classifications-add') as HTMLButtonElement

const confirm = () =>
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  )

const select = (...names: string[]) =>
  names.forEach((name) =>
    fireEvent.click(within(rowFor(name)).getByRole('checkbox'))
  )

const openSettings = async () => {
  fireEvent.click(screen.getByTestId('classifications-table-extensions-open'))
  return screen.findByTestId('classifications-table-extensions-panel')
}

const toggleColumn = (panel: HTMLElement, key: string) => {
  const toggle = within(panel).getByTestId(
    `classifications-table-extensions-toggle-${key}`
  )
  fireEvent.click(toggle.querySelector('input') ?? toggle)
}

const inputIn = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}

const treeRow = (label: string) => {
  const content = within(screen.getByTestId('categories-tree'))
    .getByText(label)
    .closest('.p-treenode-content')
  if (!content) throw new Error(`no tree row ${label}`)
  return content as HTMLElement
}

// What PrimeReact's tree drag and drop reads from the DOM event.
const dataTransfer = () => ({
  setData: vi.fn(),
  types: ['text', 'categories'],
  dropEffect: '',
})

const rebuiltRoots = () =>
  vi
    .mocked(rebuildCategoryTreeCall)
    .mock.calls.map(([, root]) => root)
    .sort()

describe('Classifications list', () => {
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
        tableConfig.configurations = [{ key: 'ext_classifications' }]
      }
    )
    vi.mocked(getCategories).mockResolvedValue({
      values: classifications as never,
      totalRecords: 12,
    })
    vi.mocked(deleteSingleCategory).mockResolvedValue({})
    vi.mocked(getCategoryParentsCall).mockImplementation(async (_t, id) => {
      if (id === 'material' || id === 'fit') throw notFound()
      return [{ id: 'fit' }] as never
    })
    vi.mocked(rebuildCategoryTreeCall).mockImplementation(
      async (_tenant, rootId) =>
        (trees().find(({ id }) => id === rootId) ??
          treeNode(rootId, 9)) as never
    )
    vi.mocked(getCategoryTreesCall).mockResolvedValue(trees() as never)
    vi.mocked(fetchCategory).mockImplementation(
      async (_tenant, id) => ({ id, metadata: { version: 3 } }) as never
    )
    vi.mocked(patchCategoryCall).mockResolvedValue({} as never)
    vi.mocked(createNewCategory).mockResolvedValue('new-id')
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.clearAllMocks()
    vi.mocked(getCategories).mockReset()
    vi.mocked(deleteSingleCategory).mockReset()
    vi.mocked(getCategoryParentsCall).mockReset()
    vi.mocked(rebuildCategoryTreeCall).mockReset()
  })

  describe('table', () => {
    it('pages through classifications only, unpublished included, newest first, with the name and validity columns', async () => {
      renderList()

      expect(await screen.findByText('Slim')).toBeTruthy()
      expect(screen.getByText('Wide')).toBeTruthy()
      expect(screen.getByText('Classifications')).toBeTruthy()
      const headers = within(table())
        .getAllByRole('columnheader')
        .map((header) => header.textContent ?? '')
      for (const header of ['Name', 'Valid From', 'Valid To']) {
        expect(headers.some((text) => text.includes(header))).toBe(true)
      }
      expect(within(rowFor('Slim')).getByText(/2031/)).toBeTruthy()
      // No validity date reads as MD's placeholder.
      expect(within(rowFor('Wide')).getAllByText('--')).toHaveLength(2)

      const [tenant, pagination, type, showRoots, showUnpublished] =
        vi.mocked(getCategories).mock.calls[0]
      expect(tenant).toBe('tnt')
      expect(pagination).toMatchObject({
        currentPage: 1,
        rows: 10,
        sortField: 'metadata.createdAt',
        sortOrder: -1,
      })
      expect(type).toBe(CategoryType.CLASSIFICATION)
      expect(showRoots).toBe(false)
      expect(showUnpublished).toBe(true)
      // The paginator reports the service total, not the rows on the page.
      expect(within(table()).getByText(/12/)).toBeTruthy()
    })

    it('shows the empty text when there is no classification', async () => {
      vi.mocked(getCategories).mockResolvedValue({
        values: [],
        totalRecords: 0,
      })
      renderList()

      expect(await screen.findByText('No classification yet')).toBeTruthy()
    })

    it('reports classifications that could not be loaded', async () => {
      vi.mocked(getCategories).mockRejectedValue(new Error('down'))
      renderList()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading classifications.',
          ''
        )
      )
    })

    it('filters by name', async () => {
      renderList()
      await screen.findByText('Slim')
      const nameFilter = within(table())
        .getAllByRole('textbox')
        .find((input) => input.closest('th'))
      if (!nameFilter) throw new Error('no name filter')

      fireEvent.change(nameFilter, { target: { value: 'sli' } })

      await waitFor(() =>
        expect(vi.mocked(getCategories).mock.lastCall?.[1]).toMatchObject({
          filters: { localizedName: { value: 'sli', matchMode: 'contains' } },
        })
      )
    })

    it('registers the date filters on the validity fields', async () => {
      renderList()
      await screen.findByText('Slim')

      await waitFor(() =>
        expect(vi.mocked(getCategories).mock.lastCall?.[1]).toMatchObject({
          filters: {
            'validity.from': { value: null, matchMode: 'equals' },
            'validity.to': { value: null, matchMode: 'equals' },
          },
        })
      )
    })

    it('opens a classification on row click and on row edit', async () => {
      const { unmount } = renderList()
      fireEvent.click(await screen.findByText('Slim'))
      expect(screen.getByTestId('location').textContent).toBe('/slim')
      unmount()

      renderList()
      await screen.findByText('Slim')
      fireEvent.click(rowButton('Wide', 'Edit'))
      expect(screen.getByTestId('location').textContent).toBe('/wide')
    })

    it('opens the add page from the header button in the list view', async () => {
      renderList()
      await screen.findByText('Slim')
      expect(addButton().textContent).toBe('Add new Classification')

      fireEvent.click(addButton())

      expect(screen.getByTestId('location').textContent).toBe('/add')
    })

    it('drops the rows of the previous tenant and loads the new one', async () => {
      const { switchTenant } = renderList()
      await screen.findByText('Slim')
      select('Slim')
      vi.mocked(getCategories).mockResolvedValue({
        values: [classification('other', 'Other')] as never,
        totalRecords: 1,
      })

      switchTenant('tnt2')

      expect(await screen.findByText('Other')).toBeTruthy()
      expect(screen.queryByText('Slim')).toBeNull()
      expect(vi.mocked(getCategories).mock.lastCall?.[0]).toBe('tnt2')
      expect(batchDeleteButton().textContent).toBe('Delete')
    })

    it('ignores a response that arrives after a newer request', async () => {
      let resolveFirst: (value: never) => void = () => undefined
      vi.mocked(getCategories).mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve))
      )
      const { switchTenant } = renderList()
      await waitFor(() => expect(getCategories).toHaveBeenCalledTimes(1))
      vi.mocked(getCategories).mockResolvedValue({
        values: [classification('other', 'Other')] as never,
        totalRecords: 1,
      })

      switchTenant('tnt2')
      expect(await screen.findByText('Other')).toBeTruthy()
      resolveFirst({ values: classifications, totalRecords: 12 } as never)

      await waitFor(() => expect(screen.queryByText('Slim')).toBeNull())
      expect(screen.getByText('Other')).toBeTruthy()
    })
  })

  describe('column settings', () => {
    it('hides the columns hidden in the ext_classifications configuration', async () => {
      tableConfig.columns = [
        { key: 'validFrom', label: 'Valid From', visible: false },
      ]
      renderList()
      await screen.findByText('Slim')

      expect(tableConfig.fetchTableConfiguration).toHaveBeenCalledWith(
        'ext_classifications'
      )
      expect(within(table()).queryByText('Valid From')).toBeNull()
      expect(within(rowFor('Slim')).queryByText(/2031/)).toBeNull()
      expect(within(table()).getAllByText('Valid To').length).toBeGreaterThan(0)
    })

    it('stores a hidden column under ext_classifications and hides it', async () => {
      renderList()
      await screen.findByText('Slim')

      toggleColumn(await openSettings(), 'validTo')
      fireEvent.click(
        screen.getByTestId('classifications-table-extensions-save')
      )

      await waitFor(() =>
        expect(tableConfig.updateTableConfiguration).toHaveBeenCalledWith(
          'ext_classifications',
          {
            table: {
              columns: [
                { key: 'name', label: 'Name', visible: true },
                { key: 'validFrom', label: 'Valid From', visible: true },
                { key: 'validTo', label: 'Valid To', visible: false },
              ],
              mixins: [],
            },
          }
        )
      )
      await waitFor(() =>
        expect(
          screen.queryByTestId('classifications-table-extensions-panel')
        ).toBeNull()
      )
      await waitFor(() =>
        expect(within(table()).queryByText('Valid To')).toBeNull()
      )
    })

    it('offers the three columns and no mixin picker', async () => {
      renderList()
      await screen.findByText('Slim')

      const panel = await openSettings()

      for (const key of ['name', 'validFrom', 'validTo']) {
        expect(
          within(panel).getByTestId(
            `classifications-table-extensions-toggle-${key}`
          )
        ).toBeTruthy()
      }
      expect(within(panel).queryByRole('combobox')).toBeNull()
      expect(within(panel).queryByText('Mixins')).toBeNull()
    })

    it('shows no mixin columns stored earlier but keeps them when saving', async () => {
      const stored = [
        { key: 'seo.title', label: { en: 'SEO title' }, type: 'TEXT' },
      ]
      tableConfig.mixins = stored
      renderList()
      await screen.findByText('Slim')
      expect(within(table()).queryByText('SEO title')).toBeNull()

      toggleColumn(await openSettings(), 'name')
      fireEvent.click(
        screen.getByTestId('classifications-table-extensions-save')
      )

      await waitFor(() =>
        expect(tableConfig.updateTableConfiguration).toHaveBeenCalledWith(
          'ext_classifications',
          {
            table: {
              columns: expect.arrayContaining([
                { key: 'name', label: 'Name', visible: false },
              ]),
              mixins: stored,
            },
          }
        )
      )
    })

    it('keeps the table settings open when saving fails', async () => {
      tableConfig.updateTableConfiguration.mockRejectedValue(new Error('down'))
      renderList()
      await screen.findByText('Slim')

      await openSettings()
      fireEvent.click(
        screen.getByTestId('classifications-table-extensions-save')
      )

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to save column settings',
          undefined
        )
      )
      expect(
        screen.getByTestId('classifications-table-extensions-panel')
      ).toBeTruthy()
    })
  })

  describe('delete', () => {
    it('deletes one classification with its sub-classifications and rebuilds its root', async () => {
      renderList()
      await screen.findByText('Slim')

      fireEvent.click(rowButton('Slim', 'Delete'))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('Delete classification?')).toBeTruthy()
      expect(
        within(dialog).getByText(
          'Are you sure you want to delete classification Slim?'
        )
      ).toBeTruthy()
      confirm()

      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith(
          'Classifications deleted successfully'
        )
      )
      expect(toast.showSuccess).toHaveBeenCalledTimes(1)
      expect(deleteSingleCategory).toHaveBeenCalledWith('tnt', 'slim', true)
      expect(getCategoryParentsCall).toHaveBeenCalledWith('tnt', 'slim', true)
      await waitFor(() => expect(rebuiltRoots()).toEqual(['fit']))
      // The list is loaded again afterwards.
      await waitFor(() => expect(getCategories).toHaveBeenCalledTimes(2))
      expect(toast.showError).not.toHaveBeenCalled()
    })

    it('batch deletes the selection one by one with a message each and one rebuild per surviving root', async () => {
      renderList()
      await screen.findByText('Slim')
      select('Slim', 'Wide', 'Material')
      expect(batchDeleteButton().textContent).toBe('Delete (3)')

      fireEvent.click(batchDeleteButton())
      expect(
        within(screen.getByRole('dialog')).getByText(
          'Delete classifications (3)?'
        )
      ).toBeTruthy()
      confirm()

      await waitFor(() => expect(toast.showSuccess).toHaveBeenCalledTimes(3))
      expect(
        vi.mocked(deleteSingleCategory).mock.calls.map(([, id]) => id)
      ).toEqual(['slim', 'wide', 'material'])
      // `material` was a root itself, so its tree went with it.
      await waitFor(() => expect(rebuiltRoots()).toEqual(['fit']))
      await waitFor(() =>
        expect(batchDeleteButton().textContent).toBe('Delete')
      )
    })

    it('reports a failed delete, keeps it selected and rebuilds a root that could not be deleted', async () => {
      vi.mocked(deleteSingleCategory).mockImplementation(async (_t, id) => {
        if (id === 'material') throw new Error('in use')
        return {}
      })
      renderList()
      await screen.findByText('Slim')
      select('Slim', 'Material')
      fireEvent.click(batchDeleteButton())
      confirm()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while deleting classifications.',
          ''
        )
      )
      expect(toast.showError).toHaveBeenCalledTimes(1)
      expect(toast.showSuccess).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(rebuiltRoots()).toEqual(['fit', 'material']))
      await waitFor(() =>
        expect(batchDeleteButton().textContent).toBe('Delete (1)')
      )
    })

    it('deletes nothing when the roots cannot be resolved', async () => {
      vi.mocked(getCategoryParentsCall).mockRejectedValue(new Error('down'))
      renderList()
      await screen.findByText('Slim')

      fireEvent.click(rowButton('Slim', 'Delete'))
      confirm()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while deleting classifications.',
          ''
        )
      )
      expect(deleteSingleCategory).not.toHaveBeenCalled()
      expect(rebuildCategoryTreeCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).not.toHaveBeenCalled()
    })

    it('reports a tree that could not be rebuilt after the delete', async () => {
      vi.mocked(rebuildCategoryTreeCall).mockRejectedValue(new Error('down'))
      renderList()
      await screen.findByText('Slim')

      fireEvent.click(rowButton('Slim', 'Delete'))
      confirm()

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'The category tree could not be refreshed',
          ''
        )
      )
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Classifications deleted successfully'
      )
    })
  })

  describe('tree view', () => {
    it('keeps the view in the URL when switching to the tree and drops it when switching back', async () => {
      renderList('/', { hashRouter: true })
      await screen.findByText('Slim')

      fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

      await waitFor(() =>
        expect(screen.getByTestId('search').textContent).toContain('view=tree')
      )
      expect(await screen.findByTestId('categories-tree')).toBeTruthy()
      expect(getCategoryTreesCall).toHaveBeenCalledWith('tnt', {
        type: 'CLASSIFICATION',
      })

      fireEvent.click(screen.getByRole('button', { name: 'List' }))

      await waitFor(() =>
        expect(screen.getByTestId('search').textContent).not.toContain('view=')
      )
      expect(await screen.findByTestId('classifications-table')).toBeTruthy()
    })

    it('clears the table selection when the view changes', async () => {
      renderList('/', { hashRouter: true })
      await screen.findByText('Slim')
      select('Slim')
      expect(batchDeleteButton().textContent).toBe('Delete (1)')

      fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
      await screen.findByTestId('categories-tree')
      fireEvent.click(screen.getByRole('button', { name: 'List' }))
      await screen.findByText('Slim')

      expect(batchDeleteButton().textContent).toBe('Delete')
    })

    it('shows the tree for ?view=tree and keeps a clicked classification in the URL', async () => {
      renderTreeView('/?view=tree')

      fireEvent.click(await screen.findByText('Material'))

      await waitFor(() => expect(searchParam('categoryId')).toBe('material'))
      expect(searchParam('view')).toBe('tree')
      expect(await screen.findByTestId('category-details-panel')).toBeTruthy()
      expect(screen.queryByTestId('classifications-table')).toBeNull()
      expect(getCategories).not.toHaveBeenCalled()
    })

    it('saves the quick edit of the selected classification', async () => {
      renderTreeView('/?view=tree&categoryId=slim')
      await screen.findByTestId('category-details-panel')
      expect(inputIn('category-panel-code').readOnly).toBe(true)

      fireEvent.change(
        within(screen.getByTestId('category-panel-name')).getAllByRole(
          'textbox'
        )[0],
        { target: { value: 'Slim fit' } }
      )
      await waitFor(() =>
        expect(
          (screen.getByTestId('category-panel-save') as HTMLButtonElement)
            .disabled
        ).toBe(false)
      )
      fireEvent.click(screen.getByTestId('category-panel-save'))

      await waitFor(() =>
        expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
          id: 'slim',
          localizedName: { en: 'Slim fit' },
          metadata: { version: 3 },
        })
      )
      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith('Updated category!')
      )
      expect(rebuiltRoots()).toEqual(['fit'])
    })

    it('opens the add panel from the header button and creates a top-level classification', async () => {
      renderTreeView('/?view=tree')
      await screen.findByText('Material')

      fireEvent.click(addButton())

      const panel = await screen.findByTestId('new-category-panel')
      expect(within(panel).getByText('Top level')).toBeTruthy()
      expect(screen.getByTestId('location').textContent).toBe('/')
      fireEvent.change(
        within(screen.getByTestId('category-panel-name')).getAllByRole(
          'textbox'
        )[0],
        { target: { value: 'Season' } }
      )
      fireEvent.change(inputIn('category-panel-code'), {
        target: { value: 'SEASON' },
      })
      fireEvent.click(screen.getByTestId('new-category-create'))

      await waitFor(() =>
        expect(createNewCategory).toHaveBeenCalledWith(
          'tnt',
          expect.objectContaining({
            code: 'SEASON',
            localizedName: { en: 'Season' },
            published: true,
            type: 'CLASSIFICATION',
            parentId: undefined,
            // After fit (0) and material (1).
            position: 2,
          })
        )
      )
      await waitFor(() => expect(searchParam('categoryId')).toBe('new-id'))
      expect(searchParam('view')).toBe('tree')
    })

    it('adds a classification at the place picked in a node menu', async () => {
      renderTreeView('/?view=tree&categoryId=slim')
      await screen.findByTestId('category-details-panel')

      fireEvent.mouseEnter(treeRow('Slim'))
      fireEvent.click(await screen.findByTestId('category-node-add-slim'))
      fireEvent.click(await screen.findByText('Add below'))

      const panel = await screen.findByTestId('new-category-panel')
      expect(within(panel).getByText('Below Slim')).toBeTruthy()
      fireEvent.change(
        within(screen.getByTestId('category-panel-name')).getAllByRole(
          'textbox'
        )[0],
        { target: { value: 'Regular' } }
      )
      fireEvent.change(inputIn('category-panel-code'), {
        target: { value: 'REGULAR' },
      })
      fireEvent.click(screen.getByTestId('new-category-create'))

      await waitFor(() =>
        expect(createNewCategory).toHaveBeenCalledWith(
          'tnt',
          expect.objectContaining({
            code: 'REGULAR',
            type: 'CLASSIFICATION',
            parentId: 'fit',
            position: 1,
          })
        )
      )
      // slim 0 | new | wide 1: no gap, so wide moves down.
      expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
        id: 'wide',
        position: 2,
        metadata: { version: 3 },
      })
      await waitFor(() => expect(rebuiltRoots()).toEqual(['fit']))
    })

    it('moves a dragged classification to its new parent and rebuilds the old and the new root', async () => {
      renderTreeView('/?view=tree&categoryId=slim')
      await screen.findByTestId('category-details-panel')

      fireEvent.dragStart(treeRow('Wide'), { dataTransfer: dataTransfer() })
      fireEvent.drop(treeRow('Material'), { dataTransfer: dataTransfer() })

      await waitFor(() =>
        expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
          id: 'wide',
          parentId: 'material',
          metadata: { version: 3 },
        })
      )
      await waitFor(() => expect(rebuiltRoots()).toEqual(['fit', 'material']))
    })
  })

  describe('without Categories Manager', () => {
    beforeEach(() => {
      permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    })

    it('keeps create, row edit, row delete, batch delete and the column settings unavailable in the list', async () => {
      renderList()
      await screen.findByText('Slim')

      expect(addButton().disabled).toBe(true)
      expect(rowButton('Slim', 'Delete').disabled).toBe(true)
      expect(rowButton('Slim', 'Edit').disabled).toBe(true)
      select('Slim')
      expect(batchDeleteButton().disabled).toBe(true)

      const panel = await openSettings()
      expect(
        (
          screen.getByTestId(
            'classifications-table-extensions-save'
          ) as HTMLButtonElement
        ).disabled
      ).toBe(true)
      const toggle = within(panel).getByTestId(
        'classifications-table-extensions-toggle-name'
      )
      expect(
        (toggle.querySelector('input') ?? toggle).hasAttribute('disabled')
      ).toBe(true)
    })

    it('still opens a classification on row click', async () => {
      renderList()
      fireEvent.click(await screen.findByText('Slim'))

      expect(screen.getByTestId('location').textContent).toBe('/slim')
    })

    it('keeps drag, create, quick edit and delete unavailable in the tree', async () => {
      renderTreeView('/?view=tree&categoryId=slim')
      await screen.findByTestId('category-details-panel')

      expect(addButton().disabled).toBe(true)
      expect(treeRow('Wide').getAttribute('draggable')).not.toBe('true')
      expect(document.querySelector('.p-treenode-droppoint')).toBeNull()
      expect(
        (screen.getByTestId('category-panel-save') as HTMLButtonElement)
          .disabled
      ).toBe(true)
      expect(
        (screen.getByTestId('category-panel-delete') as HTMLButtonElement)
          .disabled
      ).toBe(true)
      expect(inputIn('category-panel-code').readOnly).toBe(true)
    })
  })
})
