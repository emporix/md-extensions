/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createNewCatalog,
  fetchCatalog,
  modifyCatalog,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import CatalogPage from './Catalog.page'

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const sites = vi.hoisted(() => ({
  sites: [
    { code: 'main', name: 'Main site' },
    { code: 'de', name: 'German site' },
  ],
}))

vi.mock('@emporix/api-calls', () => ({
  fetchCatalogs: vi.fn(),
  fetchCatalog: vi.fn(),
  createNewCatalog: vi.fn(),
  modifyCatalog: vi.fn(),
  removeCatalog: vi.fn(),
}))

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [{ id: 'en' }, { id: 'de' }] }),
}))

vi.mock('../context/SitesProvider', () => ({
  useSites: () => sites,
}))

// The categories selector pages through the Category Service on its own;
// here it only shows what the page hands it and reports a pick.
vi.mock('../components/shared/CategoriesSelector', () => ({
  default: (props: {
    value?: string[]
    canManage?: boolean
    onChange: (ids: string[]) => void
  }) => (
    <div data-testid="categories-selector">
      <span data-testid="categories-value">
        {(props.value ?? []).join(',')}
      </span>
      <button
        type="button"
        disabled={!props.canManage}
        onClick={() => props.onChange([...(props.value ?? []), 'cat-new'])}
        data-testid="categories-add"
      >
        add
      </button>
    </div>
  ),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const loaded = {
  id: 'summer',
  code: 'summer-code',
  name: { en: 'Summer' },
  description: { en: 'Summer goods' },
  status: 'visible',
  categoryIds: ['cat-1'],
  publishedSites: ['main'],
  visibility: {
    visible: true,
    from: '2026-06-01T08:00:00.000Z',
    to: '2026-08-31T20:00:00.000Z',
  },
  metadata: {
    version: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
}

const allRights = [
  EmployeeDomains.CATALOGS_VIEWER,
  EmployeeDomains.CATALOGS_MANAGER,
  EmployeeDomains.CATEGORIES_VIEWER,
  EmployeeDomains.CATEGORIES_MANAGER,
]

const renderDetail = (path: string, tenant = 'tenant-a') =>
  renderAt(path, { list: <div>list</div>, detail: <CatalogPage /> }, tenant)

const inputIn = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}
const saveButton = () => screen.getByTestId('catalog-save') as HTMLButtonElement
const discardButton = () =>
  screen.getByTestId('catalog-discard') as HTMLButtonElement
const idInput = () => inputIn('catalog-id')
const nameInput = () => inputIn('catalog-name')
const descriptionInput = () => inputIn('catalog-description')
const visibleCheckbox = () =>
  document.getElementById('catalog-visible') as HTMLInputElement

const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })

const TAB_IDS = {
  Details: 'details',
  Categories: 'categories',
  Published: 'published',
  Visibility: 'validity',
} as const

const openTab = (label: keyof typeof TAB_IDS) =>
  fireEvent.click(screen.getByTestId(`catalog-tabs-tab-${TAB_IDS[label]}`))

describe('Catalog add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    window.location.hash = ''
    permissions.granted = [...allRights]
    vi.mocked(fetchCatalog).mockResolvedValue(structuredClone(loaded) as never)
    vi.mocked(createNewCatalog).mockResolvedValue('new-id')
    vi.mocked(modifyCatalog).mockResolvedValue(true)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens a catalog on the Details tab with its values and the id read-only', async () => {
    renderDetail('/summer')

    await waitFor(() => expect(idInput().value).toBe('summer'))
    expect(fetchCatalog).toHaveBeenCalledWith('tenant-a', 'summer')
    expect(nameInput().value).toBe('Summer')
    expect(descriptionInput().value).toBe('Summer goods')
    expect(idInput().disabled).toBe(true)
    expect(nameInput().disabled).toBe(false)
    expect(screen.getByTestId('catalog-tabs-tab-details').textContent).toBe(
      'Details'
    )
    expect(
      screen.getByTestId('catalog-tabs-panel-details').hasAttribute('hidden')
    ).toBe(false)
    expect(
      screen.getByTestId('catalog-tabs-panel-validity').hasAttribute('hidden')
    ).toBe(true)
  })

  it('creates a catalog that starts not visible and opens its edit page', async () => {
    renderDetail('/add')

    openTab('Visibility')
    expect(visibleCheckbox().checked).toBe(false)
    openTab('Details')
    type(idInput(), 'autumn')
    type(nameInput(), 'Autumn')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/new-id')
    )
    expect(createNewCatalog).toHaveBeenCalledWith('tenant-a', {
      id: 'autumn',
      name: { en: 'Autumn' },
      description: {},
      categoryIds: [],
      publishedSites: [],
      visibility: { visible: false },
    })
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Successfully created catalog.'
    )
  })

  it('leaves the id out of a new catalog when none is entered', async () => {
    renderDetail('/add')

    type(nameInput(), 'Autumn')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() => expect(createNewCatalog).toHaveBeenCalled())
    expect(vi.mocked(createNewCatalog).mock.calls[0][1]).not.toHaveProperty(
      'id'
    )
  })

  it('keeps save disabled until a name exists in one language', async () => {
    renderDetail('/add')

    type(idInput(), 'autumn')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    expect(saveButton().disabled).toBe(true)

    type(nameInput(), '  ')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    expect(saveButton().disabled).toBe(true)

    type(nameInput(), 'Autumn')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
  })

  it('shows the generic error and keeps the values when create fails', async () => {
    vi.mocked(createNewCatalog).mockRejectedValue(new Error('conflict'))
    renderDetail('/add')

    type(idInput(), 'autumn')
    type(nameInput(), 'Autumn')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Something went wrong. Check form data or try later.',
        undefined
      )
    )
    expect(screen.getByTestId('location').textContent).toBe('/add')
    expect(idInput().value).toBe('autumn')
    expect(nameInput().value).toBe('Autumn')
  })

  it('shows the generic error and keeps the values when an update fails', async () => {
    vi.mocked(modifyCatalog).mockRejectedValue(new Error('stale'))
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    type(nameInput(), 'Summer sale')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Something went wrong. Check form data or try later.',
        undefined
      )
    )
    expect(nameInput().value).toBe('Summer sale')
  })

  it('updates the catalog with the changes of every tab and reloads it', async () => {
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    type(nameInput(), 'Summer sale')
    type(descriptionInput(), 'Sale goods')
    openTab('Categories')
    fireEvent.click(screen.getByTestId('categories-add'))
    openTab('Published')
    fireEvent.click(screen.getByTestId('catalog-sites-control'))
    // CL options select on mousedown.
    fireEvent.mouseDown(await screen.findByText('German site'))
    openTab('Visibility')
    fireEvent.click(visibleCheckbox())

    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Successfully updated catalog.'
      )
    )
    expect(modifyCatalog).toHaveBeenCalledWith('tenant-a', {
      ...loaded,
      name: { en: 'Summer sale' },
      description: { en: 'Sale goods' },
      categoryIds: ['cat-1', 'cat-new'],
      publishedSites: ['main', 'de'],
      visibility: { ...loaded.visibility, visible: false },
    })
    await waitFor(() => expect(fetchCatalog).toHaveBeenCalledTimes(2))
  })

  it('shows the stored visibility dates and sends them back unchanged', async () => {
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    openTab('Visibility')
    expect(inputIn('catalog-visible-from').value).not.toBe('')
    expect(inputIn('catalog-visible-to').value).not.toBe('')

    type(nameInput(), 'Summer sale')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() => expect(modifyCatalog).toHaveBeenCalled())
    expect(vi.mocked(modifyCatalog).mock.calls[0][1].visibility).toEqual(
      loaded.visibility
    )
  })

  it('shows empty date pickers and sends no date for a catalog without visibility dates', async () => {
    vi.mocked(fetchCatalog).mockResolvedValue({
      ...structuredClone(loaded),
      visibility: { visible: true },
    } as never)
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    openTab('Visibility')
    expect(inputIn('catalog-visible-from').value).toBe('')
    expect(inputIn('catalog-visible-to').value).toBe('')

    openTab('Details')
    type(nameInput(), 'Summer sale')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() => expect(modifyCatalog).toHaveBeenCalled())
    expect(vi.mocked(modifyCatalog).mock.calls[0][1].visibility).toEqual({
      visible: true,
    })
  })

  it('returns the form to the loaded values on discard', async () => {
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    type(nameInput(), 'Other')
    await waitFor(() => expect(discardButton().disabled).toBe(false))
    fireEvent.click(discardButton())

    await waitFor(() => expect(nameInput().value).toBe('Summer'))
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
  })

  it('makes the form read-only for a catalogs viewer', async () => {
    permissions.granted = [
      EmployeeDomains.CATALOGS_VIEWER,
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    expect(nameInput().disabled).toBe(true)
    expect(descriptionInput().disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(discardButton().disabled).toBe(true)
    openTab('Categories')
    expect(
      (screen.getByTestId('categories-add') as HTMLButtonElement).disabled
    ).toBe(true)
    openTab('Published')
    expect(
      screen.getByTestId('catalog-sites-control').getAttribute('aria-disabled')
    ).toBe('true')
    openTab('Visibility')
    expect(visibleCheckbox().disabled).toBe(true)
  })

  it('hides the categories and disables the sites without Categories Viewer', async () => {
    permissions.granted = [
      EmployeeDomains.CATALOGS_VIEWER,
      EmployeeDomains.CATALOGS_MANAGER,
    ]
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    openTab('Categories')
    expect(screen.getByTestId('categories-value').textContent).toBe('')
    openTab('Published')
    expect(
      screen.getByTestId('catalog-sites-control').getAttribute('aria-disabled')
    ).toBe('true')
    expect(screen.queryByText('Main site')).toBeNull()
  })

  it('does not let a catalogs manager change categories without Categories Manager', async () => {
    permissions.granted = [
      EmployeeDomains.CATALOGS_VIEWER,
      EmployeeDomains.CATALOGS_MANAGER,
      EmployeeDomains.CATEGORIES_VIEWER,
    ]
    renderDetail('/summer')
    await waitFor(() => expect(nameInput().value).toBe('Summer'))

    openTab('Categories')
    expect(screen.getByTestId('categories-value').textContent).toBe('cat-1')
    expect(
      (screen.getByTestId('categories-add') as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('goes back to the list with a translated error when the catalog cannot be loaded', async () => {
    vi.mocked(fetchCatalog).mockRejectedValue({ response: { status: 404 } })
    renderDetail('/missing')

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/')
    )
    expect(toast.showError).toHaveBeenCalledWith(
      'Catalog could not be loaded',
      undefined
    )
  })

  it('loads a catalog whose id needs URL encoding and keeps the id in the update body', async () => {
    vi.mocked(fetchCatalog).mockResolvedValue({
      ...structuredClone(loaded),
      id: 'a/b',
    } as never)
    renderDetail('/a%2Fb')

    await waitFor(() => expect(idInput().value).toBe('a/b'))
    expect(fetchCatalog).toHaveBeenCalledWith('tenant-a', 'a%2Fb')

    type(nameInput(), 'Slash')
    await waitFor(() => expect(saveButton().disabled).toBe(false))
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(modifyCatalog).toHaveBeenCalledWith(
        'tenant-a',
        expect.objectContaining({ id: 'a/b' })
      )
    )
  })

  it.each(['/summer', '/add'])(
    'returns to the list when the host switches tenant on %s',
    async (path) => {
      const { switchTenant } = renderDetail(path, 'tenant-a')
      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toBe(path)
      )

      vi.mocked(fetchCatalog).mockRejectedValue({ response: { status: 404 } })
      switchTenant('tenant-b')

      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toBe('/')
      )
      expect(fetchCatalog).not.toHaveBeenCalledWith('tenant-b', 'summer')
      expect(toast.showError).not.toHaveBeenCalled()
    }
  )
})
