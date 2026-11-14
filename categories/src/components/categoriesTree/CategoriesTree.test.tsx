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

describe('Categories tree view', () => {
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
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // Scenario 3
  it('expands the ancestors of the selected category and shows its quick edit', async () => {
    renderTree('/?view=tree&categoryId=shoes')

    const panel = await screen.findByTestId('category-details-panel')
    expect(within(panel).getByTitle('Shoes')).toBeTruthy()
    // The branch of the selection is open, so its sibling shows too.
    expect(
      within(screen.getByTestId('categories-tree')).getByText('Shirts')
    ).toBeTruthy()
    expect(getCategoryTreesCall).toHaveBeenCalledWith('tnt', {
      type: 'STANDARD',
    })
    expect(inputIn('category-panel-code').value).toBe('SHOES')
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

    fireEvent.change(inputIn('category-panel-code'), {
      target: { value: 'SH-1' },
    })
    await waitFor(() =>
      expect(panelButton('category-panel-save').disabled).toBe(false)
    )
    fireEvent.click(panelButton('category-panel-save'))

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Updated category!')
    )
    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'shoes',
      code: 'SH-1',
      metadata: { version: 3 },
    })
    expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
  })

  // Scenario 5
  it('adds a category below the anchor from the node menu and renumbers its siblings', async () => {
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')
    const row = within(screen.getByTestId('categories-tree'))
      .getByText('Shoes')
      .closest('.p-treenode-content')
    if (!row) throw new Error('no tree row')

    fireEvent.mouseEnter(row)
    fireEvent.click(await screen.findByTestId('category-node-add-shoes'))
    fireEvent.click(await screen.findByText('Add below'))

    const panel = await screen.findByTestId('new-category-panel')
    expect(within(panel).getByText('Below Shoes')).toBeTruthy()
    const nameInput = within(
      screen.getByTestId('category-panel-name')
    ).getAllByRole('textbox')[0]
    fireEvent.change(nameInput, { target: { value: 'Boots' } })
    fireEvent.click(panelButton('new-category-create'))

    await waitFor(() =>
      expect(createNewCategory).toHaveBeenCalledWith('tnt', {
        localizedName: { en: 'Boots' },
        localizedSlug: undefined,
        localizedDescription: undefined,
        published: false,
        type: 'STANDARD',
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

  // Scenario 4
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

  // Scenario 4 + Requirement 11
  it('lets a viewer neither drag nor edit', async () => {
    permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    renderTree('/?view=tree&categoryId=shoes')
    await screen.findByTestId('category-details-panel')

    expect(contentOf('Shirts').getAttribute('draggable')).not.toBe('true')
    expect(document.querySelector('.p-treenode-droppoint')).toBeNull()
    expect(inputIn('category-panel-code').readOnly).toBe(true)
    expect(panelButton('category-panel-save').disabled).toBe(true)
    expect(panelButton('category-panel-delete').disabled).toBe(true)
  })

  it('lets a manager drag categories', async () => {
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
