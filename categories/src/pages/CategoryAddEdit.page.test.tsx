/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createNewCategory,
  fetchCategory,
  getCategoryParentsCall,
  modifyCategory,
  patchCategoryCall,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import type { Mixins } from '../models/Mixins.model'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import CategoryAddEditRoute from './CategoryAddEdit.route'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const mixinsForm = vi.hoisted(() => ({
  onEdit: undefined as
    | ((data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void)
    | undefined,
  managerPermissions: undefined as boolean | undefined,
  type: undefined as string | undefined,
  loadMixins: vi.fn(),
}))

vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchCategory: vi.fn(),
    createNewCategory: vi.fn(),
    modifyCategory: vi.fn(),
    patchCategoryCall: vi.fn(),
    getCategoryParentsCall: vi.fn(),
    rebuildCategoryTreeCall: vi.fn(),
    getAssetsForId: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }] }),
}))

// The parent picker is the CL PaginatedSelector; a button stands in for it.
vi.mock('../components/shared/CategoriesSelector', () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string
    onChange: (value: string) => void
  }) => (
    <button
      type="button"
      data-testid="category-parent"
      onClick={() => onChange('food')}
    >
      {value ?? 'none'}
    </button>
  ),
}))

// The mixins engine is copied from the companies remote with its own tests;
// here only the category wiring is under test.
vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: (props: {
    type: string
    onEdit: typeof mixinsForm.onEdit
    managerPermissions?: boolean
  }) => {
    mixinsForm.onEdit = props.onEdit
    mixinsForm.type = props.type
    mixinsForm.managerPermissions = props.managerPermissions
    return {
      loadMixins: mixinsForm.loadMixins,
      isMixinsLoading: false,
      mixinsTabs: [
        { id: 'seo', label: 'SEO mixin', content: <div>seo form</div> },
      ],
    }
  },
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const loaded = {
  id: 'shoes',
  parentId: 'clothes',
  code: 'SHO',
  localizedName: { en: 'Shoes' },
  localizedSlug: { en: 'shoes' },
  localizedDescription: { en: 'All shoes' },
  ecn: [],
  position: 3,
  validity: {},
  published: true,
  type: 'STANDARD',
  mixins: { seo: { title: 'Old' } },
  metadata: { version: 7, mixins: { seo: 'https://schema/seo.json' } },
}

const renderDetail = (path: string) =>
  renderAt(
    path,
    { list: <div>list</div>, detail: <CategoryAddEditRoute /> },
    'tnt'
  )

const inputIn = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}
const button = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement
const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })

describe('Category add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    vi.mocked(fetchCategory).mockResolvedValue(loaded as never)
    vi.mocked(createNewCategory).mockResolvedValue('boots')
    vi.mocked(modifyCategory).mockResolvedValue({} as never)
    vi.mocked(patchCategoryCall).mockResolvedValue({} as never)
    vi.mocked(rebuildCategoryTreeCall).mockResolvedValue({} as never)
    // `clothes` and `food` are roots (404); everything else hangs below `clothes`.
    vi.mocked(getCategoryParentsCall).mockImplementation(
      async (_tenant, id) => {
        if (id === 'clothes' || id === 'food') {
          throw { response: { status: 404 } }
        }
        return [{ id: 'clothes' }] as never
      }
    )
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // Scenario 6
  it('creates a category with a localized name and opens its page', async () => {
    renderDetail('/add')

    expect(button('category-save').disabled).toBe(true)
    type(inputIn('category-name'), 'Boots')
    type(inputIn('category-code'), 'BOO')
    await waitFor(() => expect(button('category-save').disabled).toBe(false))
    fireEvent.click(button('category-save'))

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/boots')
    )
    expect(createNewCategory).toHaveBeenCalledWith('tnt', {
      navigation: false,
      index: false,
      code: 'BOO',
      localizedName: { en: 'Boots' },
      localizedSlug: undefined,
      localizedDescription: undefined,
      ecn: [],
      parentId: undefined,
      validity: {},
      published: false,
    })
    expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'clothes')
    expect(toast.showSuccess).toHaveBeenCalledWith('Created category!')
  })

  it('does not save without a name and shows the details tab', async () => {
    renderDetail('/add')

    type(inputIn('category-code'), 'BOO')
    await waitFor(() => expect(button('category-save').disabled).toBe(false))
    fireEvent.click(button('category-save'))

    expect(await screen.findByText('Required')).toBeTruthy()
    expect(createNewCategory).not.toHaveBeenCalled()
  })

  it('keeps media and mixins for a saved category', async () => {
    renderDetail('/add')

    expect(button('category-tabs-tab-media').disabled).toBe(true)
    expect(screen.queryByTestId('category-tabs-tab-seo')).toBeNull()
  })

  it('shows media and the mixin tabs on a saved category', async () => {
    renderDetail('/shoes')
    await screen.findByText('Shoes')

    expect(button('category-tabs-tab-media').disabled).toBe(false)
    expect(button('category-tabs-tab-seo').textContent).toBe('SEO mixin')
  })

  // Scenario 7
  it('updates a moved category and rebuilds the old and the new root', async () => {
    // Once saved, `shoes` hangs below its new parent `food`, a root itself.
    vi.mocked(getCategoryParentsCall).mockImplementation(
      async (_tenant, id) => {
        if (id === 'clothes' || id === 'food') {
          throw { response: { status: 404 } }
        }
        return [
          {
            id: vi.mocked(modifyCategory).mock.calls.length
              ? 'food'
              : 'clothes',
          },
        ] as never
      }
    )
    renderDetail('/shoes')
    await screen.findByText('Shoes')

    type(inputIn('category-code'), 'SHO-2')
    fireEvent.click(screen.getByTestId('category-parent'))
    await waitFor(() => expect(button('category-save').disabled).toBe(false))
    fireEvent.click(button('category-save'))

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith('Updated category!')
    )
    expect(modifyCategory).toHaveBeenCalledWith(
      'tnt',
      expect.objectContaining({
        id: 'shoes',
        code: 'SHO-2',
        parentId: 'food',
        position: 3,
        metadata: loaded.metadata,
      })
    )
    const rebuilt = vi
      .mocked(rebuildCategoryTreeCall)
      .mock.calls.map(([, root]) => root)
    // The new root of `shoes` first, then its old parent `clothes` (a root).
    expect(rebuilt).toEqual(['food', 'clothes'])
    expect(getCategoryParentsCall).toHaveBeenCalledWith('tnt', 'shoes', true)
    expect(getCategoryParentsCall).toHaveBeenCalledWith('tnt', 'clothes', true)
    // The page reloads the saved category.
    await waitFor(() => expect(fetchCategory).toHaveBeenCalledTimes(2))
  })

  it('warns when the category is saved but its tree cannot be rebuilt', async () => {
    vi.mocked(rebuildCategoryTreeCall).mockRejectedValue(new Error('down'))
    renderDetail('/shoes')
    await screen.findByText('Shoes')

    type(inputIn('category-code'), 'SHO-2')
    await waitFor(() => expect(button('category-save').disabled).toBe(false))
    fireEvent.click(button('category-save'))

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Updated category!',
        'The category tree could not be refreshed',
        'warn'
      )
    )
  })

  // Scenario 9
  it('stores mixin values on the category with the schema url', async () => {
    renderDetail('/shoes')
    await screen.findByText('Shoes')
    await waitFor(() =>
      expect(mixinsForm.loadMixins).toHaveBeenCalledWith(
        loaded.metadata.mixins,
        loaded.mixins
      )
    )
    expect(mixinsForm.type).toBe('CATEGORY')
    expect(screen.getByTestId('category-tabs-tab-seo').textContent).toBe(
      'SEO mixin'
    )

    await mixinsForm.onEdit?.(
      { title: 'New' },
      { key: 'seo', url: 'https://schema/seo-v2.json' }
    )

    expect(patchCategoryCall).toHaveBeenCalledWith('tnt', {
      id: 'shoes',
      mixins: { seo: { title: 'New' } },
      metadata: { version: 7, mixins: { seo: 'https://schema/seo-v2.json' } },
    })
    expect(toast.showSuccess).toHaveBeenCalledWith('Updated category!')
  })

  // Requirement 11
  it('keeps every field and action read-only for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
    renderDetail('/shoes')
    await screen.findByText('Shoes')

    expect(inputIn('category-code').readOnly).toBe(true)
    expect(inputIn('category-id').readOnly).toBe(true)
    expect(button('category-save').disabled).toBe(true)
    expect(button('category-discard').disabled).toBe(true)
    expect(mixinsForm.managerPermissions).toBe(false)
  })

  it('returns to the list when the category cannot be loaded', async () => {
    vi.mocked(fetchCategory).mockRejectedValue(new Error('404'))
    renderDetail('/missing')

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/')
    )
    expect(toast.showError).toHaveBeenCalledWith(
      'Cannot load category',
      undefined
    )
  })
})
