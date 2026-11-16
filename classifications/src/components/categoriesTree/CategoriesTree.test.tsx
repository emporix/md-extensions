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
  createNewCategory,
  deleteSingleCategory,
  fetchCategory,
  getCategoryParentsCall,
  getCategoryTreesCall,
  patchCategoryCall,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { renderAt } from '../../test/renderWithRouter'
import { CategoryTree } from '../../models/Category.model'
import CategoriesTree from './CategoriesTree'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    getCategoryTreesCall: vi.fn(),
    rebuildCategoryTreeCall: vi.fn(),
    getCategoryParentsCall: vi.fn(),
    fetchCategory: vi.fn(),
    patchCategoryCall: vi.fn(),
    createNewCategory: vi.fn(),
    deleteSingleCategory: vi.fn(),
  }
})

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }] }),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const tree = (
  id: string,
  position: number,
  subcategories: CategoryTree[] = []
): CategoryTree => ({
  id,
  position,
  published: true,
  code: id.toUpperCase(),
  localizedName: { en: id.charAt(0).toUpperCase() + id.slice(1) },
  subcategories,
})

// clothes (0) → shoes (0), shirts (1); food (1)
const trees = (): CategoryTree[] => [
  tree('clothes', 0, [tree('shoes', 0), tree('shirts', 1)]),
  tree('food', 1),
]

const renderTree = (path: string) =>
  renderAt(path, { list: <CategoriesTree />, detail: <div>detail</div> }, 'tnt')

const nameInput = () =>
  within(screen.getByTestId('category-panel-name')).getAllByRole('textbox')[0]

const openAddMenu = async (id: string, label: string) => {
  fireEvent.mouseEnter(contentOf(label))
  fireEvent.click(await screen.findByTestId(`category-node-add-${id}`))
}

const inputIn = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}

const panelButton = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement

const contentOf = (label: string) => {
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

describe('Classifications tree view', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    vi.mocked(getCategoryTreesCall).mockResolvedValue(trees() as never)
    vi.mocked(rebuildCategoryTreeCall).mockImplementation(
      async (_tenant, rootId) =>
        (trees().find(({ id }) => id === rootId) ?? tree(rootId, 9)) as never
    )
    vi.mocked(fetchCategory).mockImplementation(
      async (_tenant, id) => ({ id, metadata: { version: 3 } }) as never
    )
    vi.mocked(patchCategoryCall).mockResolvedValue({} as never)
    vi.mocked(createNewCategory).mockResolvedValue('new-id')
    vi.mocked(getCategoryParentsCall).mockResolvedValue([])
    vi.mocked(deleteSingleCategory).mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('loads the classification trees only and shows the quick edit of the selected one', async () => {
    renderTree('/?view=tree&categoryId=shoes')

    const panel = await screen.findByTestId('category-details-panel')
    expect(within(panel).getByTitle('Shoes')).toBeTruthy()
    // The branch of the selection is open, so its sibling shows too.
    expect(
      within(screen.getByTestId('categories-tree')).getByText('Shirts')
    ).toBeTruthy()
    expect(getCategoryTreesCall).toHaveBeenCalledWith('tnt', {
      type: 'CLASSIFICATION',
    })
    expect(inputIn('category-panel-code').value).toBe('SHOES')
  })

  it('keeps the code of an existing classification read-only for a manager', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    expect(inputIn('category-panel-code').readOnly).toBe(true)
    expect(inputIn('category-panel-id').readOnly).toBe(true)
    expect((nameInput() as HTMLInputElement).readOnly).toBe(false)
  })

  it('keeps the view and puts a clicked category into the URL', async () => {
    renderTree('/?view=tree')

    fireEvent.click(await screen.findByText('Food'))

    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toBe(
        '?view=tree&categoryId=food'
      )
    )
    expect(await screen.findByTestId('category-details-panel')).toBeTruthy()
  })

  it('saves the quick edit with the current version and rebuilds the root', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.change(nameInput(), { target: { value: 'Sneakers' } })
    await waitFor(() =>
      expect(panelButton('category-panel-save').disabled).toBe(false)
    )
    fireEvent.click(panelButton('category-panel-save'))

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Updated category!')
    )
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'shoes',
      localizedName: { en: 'Sneakers' },
      metadata: { version: 3 },
    })
    expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
  })

  it('reports a quick edit that could not be saved', async () => {
    vi.mocked(patchCategoryCall).mockRejectedValue(new Error('down'))
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.change(nameInput(), { target: { value: 'Sneakers' } })
    await waitFor(() =>
      expect(panelButton('category-panel-save').disabled).toBe(false)
    )
    fireEvent.click(panelButton('category-panel-save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Cannot save category',
        undefined
      )
    )
    expect(toast.showSuccess).not.toHaveBeenCalled()
    expect(rebuildCategoryTreeCall).not.toHaveBeenCalled()
  })

  it('opens the detail page of the selected classification and remembers the way back', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.click(panelButton('category-panel-open'))

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/shoes')
    )
    expect(
      new URLSearchParams(screen.getByTestId('search').textContent ?? '').get(
        'backTo'
      )
    ).toBe('/?view=tree&categoryId=shoes')
  })

  it('adds a classification below the anchor from the node menu and renumbers its siblings', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    await openAddMenu('shoes', 'Shoes')
    fireEvent.click(await screen.findByText('Add below'))

    const panel = await screen.findByTestId('new-category-panel')
    expect(within(panel).getByText('Below Shoes')).toBeTruthy()
    fireEvent.change(nameInput(), { target: { value: 'Boots' } })
    fireEvent.change(inputIn('category-panel-code'), {
      target: { value: 'BOOTS' },
    })
    fireEvent.click(panelButton('new-category-create'))

    await waitFor(() =>
      expect(createNewCategory).toHaveBeenCalledWith('tnt', {
        code: 'BOOTS',
        localizedName: { en: 'Boots' },
        localizedSlug: undefined,
        localizedDescription: undefined,
        // As on the full add page, a classification starts published.
        published: true,
        type: 'CLASSIFICATION',
        parentId: 'clothes',
        // shoes 0 | new | shirts 1: no gap, so the siblings are renumbered.
        position: 1,
      })
    )
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'shirts',
      position: 2,
      metadata: { version: 3 },
    })
    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Created category!')
    )
    expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain(
        'categoryId=new-id'
      )
    )
  })

  it('adds a classification as a child from the node menu', async () => {
    renderTree('/?view=tree')
    await screen.findByText('Food')

    await openAddMenu('food', 'Food')
    fireEvent.click(await screen.findByText('Add child'))

    const panel = await screen.findByTestId('new-category-panel')
    expect(within(panel).getByText('Subcategory of Food')).toBeTruthy()
    fireEvent.change(nameInput(), { target: { value: 'Fruit' } })
    fireEvent.change(inputIn('category-panel-code'), {
      target: { value: 'FRUIT' },
    })
    fireEvent.click(panelButton('new-category-create'))

    await waitFor(() =>
      expect(createNewCategory).toHaveBeenCalledWith(
        'tnt',
        expect.objectContaining({
          code: 'FRUIT',
          type: 'CLASSIFICATION',
          parentId: 'food',
        })
      )
    )
    expect(patchCategoryCall).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'food')
    )
  })

  it('adds a classification above the anchor from the node menu', async () => {
    renderTree('/?view=tree')
    await screen.findByText('Food')

    await openAddMenu('food', 'Food')
    fireEvent.click(await screen.findByText('Add above'))

    const panel = await screen.findByTestId('new-category-panel')
    expect(within(panel).getByText('Above Food')).toBeTruthy()
    fireEvent.change(nameInput(), { target: { value: 'Drinks' } })
    fireEvent.change(inputIn('category-panel-code'), {
      target: { value: 'DRINKS' },
    })
    fireEvent.click(panelButton('new-category-create'))

    // clothes 0 | new | food 1: no gap, so food moves down.
    await waitFor(() =>
      expect(createNewCategory).toHaveBeenCalledWith(
        'tnt',
        expect.objectContaining({
          code: 'DRINKS',
          type: 'CLASSIFICATION',
          parentId: undefined,
          position: 1,
        })
      )
    )
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'food',
      position: 2,
      metadata: { version: 3 },
    })
  })

  it('creates no classification without a code', async () => {
    renderTree('/?view=tree')
    await screen.findByText('Food')
    await openAddMenu('food', 'Food')
    fireEvent.click(await screen.findByText('Add child'))
    await screen.findByTestId('new-category-panel')

    expect(inputIn('category-panel-code').readOnly).toBe(false)
    fireEvent.change(nameInput(), { target: { value: 'Fruit' } })
    fireEvent.click(panelButton('new-category-create'))

    expect(
      await within(screen.getByTestId('new-category-panel')).findByText(
        'Required'
      )
    ).toBeTruthy()
    expect(createNewCategory).not.toHaveBeenCalled()
  })

  it('deletes the selected classification after confirmation and clears the selection', async () => {
    // The rebuilt root no longer lists the deleted classification.
    vi.mocked(rebuildCategoryTreeCall).mockResolvedValue(
      tree('clothes', 0, [tree('shirts', 1)]) as never
    )
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.click(panelButton('category-panel-delete'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Delete Classification?')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(deleteSingleCategory).toHaveBeenCalledWith('tnt', 'shoes', true)
    )
    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toBe('?view=tree')
    )
    await waitFor(() =>
      expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
    )
    expect(
      within(screen.getByTestId('categories-tree')).queryByText('Shoes')
    ).toBeNull()
    expect(
      within(screen.getByTestId('categories-tree')).getByText('Shirts')
    ).toBeTruthy()
  })

  it('reports a classification that could not be deleted and keeps it', async () => {
    vi.mocked(deleteSingleCategory).mockRejectedValue(new Error('in use'))
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.click(panelButton('category-panel-delete'))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Delete',
      })
    )

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while deleting classifications.'
      )
    )
    expect(
      within(screen.getByTestId('categories-tree')).getByText('Shoes')
    ).toBeTruthy()
    expect(rebuildCategoryTreeCall).not.toHaveBeenCalled()
  })

  it('saves a drop onto another category as a new parent and rebuilds both roots', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    fireEvent.dragStart(contentOf('Shirts'), {
      dataTransfer: dataTransfer(),
    })
    fireEvent.drop(contentOf('Food'), { dataTransfer: dataTransfer() })

    await waitFor(() =>
      expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
        id: 'shirts',
        parentId: 'food',
        metadata: { version: 3 },
      })
    )
    expect(patchCategoryCall).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(
        vi
          .mocked(rebuildCategoryTreeCall)
          .mock.calls.map(([, root]) => root)
          .sort()
      ).toEqual(['clothes', 'food'])
    )
  })

  it('saves a drop between root categories as new positions', async () => {
    renderTree('/?view=tree')
    await screen.findByText('Food')

    fireEvent.dragStart(contentOf('Food'), { dataTransfer: dataTransfer() })
    // The drop point above `clothes`, the first root.
    const dropPoint = document.querySelector('.p-treenode-droppoint')
    if (!dropPoint) throw new Error('no drop point')
    fireEvent.drop(dropPoint, { dataTransfer: dataTransfer() })

    // No free position below 0, so both roots are renumbered.
    await waitFor(() => expect(patchCategoryCall).toHaveBeenCalledTimes(2))
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'food',
      position: 0,
      metadata: { version: 3 },
    })
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'clothes',
      position: 1,
      metadata: { version: 3 },
    })
  })

  it('lets a viewer neither drag, add, edit nor delete', async () => {
    permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    expect(contentOf('Shirts').getAttribute('draggable')).not.toBe('true')
    expect(document.querySelector('.p-treenode-droppoint')).toBeNull()
    expect(inputIn('category-panel-code').readOnly).toBe(true)
    expect(inputIn('category-panel-position').readOnly).toBe(true)
    expect(inputIn('category-panel-published').disabled).toBe(true)
    expect(panelButton('category-panel-save').disabled).toBe(true)
    expect(panelButton('category-panel-delete').disabled).toBe(true)

    // The add panel a viewer can still reach creates nothing.
    await openAddMenu('shirts', 'Shirts')
    fireEvent.click(await screen.findByText('Add child'))
    await screen.findByTestId('new-category-panel')
    expect(panelButton('new-category-create').disabled).toBe(true)
    expect(inputIn('category-panel-code').readOnly).toBe(true)
  })

  it('lets a manager drag classifications', async () => {
    renderTree('/?view=tree')
    await screen.findByText('Food')

    expect(contentOf('Food').getAttribute('draggable')).toBe('true')
  })

  it('shows no tree without Categories Viewer', async () => {
    permissions.granted = []
    renderTree('/?view=tree')

    expect(await screen.findByText('No permissions')).toBeTruthy()
    expect(getCategoryTreesCall).not.toHaveBeenCalled()
  })
})
