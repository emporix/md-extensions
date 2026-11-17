/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import {
  HashRouter,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import {
  createNewCategory,
  fetchCategory,
  getCategoryParentsCall,
  getSchemaCall,
  getSchemasCall,
  modifyCategory,
  rebuildCategoryTreeCall,
} from '@emporix/api-calls'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { DashboardProvider } from '../context/Dashboard.context'
import type { AppState } from '../models/AppState.model'
import ClassificationAddEditRoute from './ClassificationAddEdit.route'

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
    fetchCategory: vi.fn(),
    createNewCategory: vi.fn(),
    modifyCategory: vi.fn(),
    getCategoryParentsCall: vi.fn(),
    rebuildCategoryTreeCall: vi.fn(),
    getSchemasCall: vi.fn(),
    getSchemaCall: vi.fn(),
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
    type,
    showUnpublished,
  }: {
    value?: string
    onChange: (value: string) => void
    type?: string
    showUnpublished?: boolean
  }) => (
    <button
      type="button"
      data-testid="classification-parent"
      data-type={type}
      data-unpublished={String(!!showUnpublished)}
      onClick={() => onChange('garden')}
    >
      {value || 'none'}
    </button>
  ),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const SCHEMA_BASE =
  'https://res.cloudinary.com/saas-ag/raw/upload/schemata2/tnt'
const OWN_SCHEMA_URL = 'https://schemas.example.com/drills.json'

const attribute = (
  key: string,
  type: string,
  metadata: Partial<
    Record<'required' | 'nullable' | 'readOnly' | 'localized', boolean>
  > = {}
) => ({
  key,
  name: { en: key },
  type,
  metadata: {
    required: false,
    nullable: false,
    readOnly: false,
    localized: false,
    ...metadata,
  },
})

const toolsSchema = {
  id: 'tools',
  name: { en: 'Tools schema' },
  types: ['CLASSIFICATION'],
  attributes: [
    attribute('voltage', 'NUMBER', { required: true }),
    attribute('colour', 'TEXT', { nullable: true }),
    attribute('weight', 'DECIMAL'),
  ],
  metadata: { version: 2, url: `${SCHEMA_BASE}/tools_v2.json` },
}

const oldToolsSchema = {
  ...toolsSchema,
  attributes: [
    attribute('voltage', 'TEXT', { required: true }),
    attribute('colour', 'TEXT'),
    attribute('length', 'NUMBER'),
  ],
  metadata: { version: 1, url: `${SCHEMA_BASE}/tools_v1.json` },
}

const ownSchema = {
  $id: OWN_SCHEMA_URL,
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Drills',
  properties: {
    chuck: { type: 'string', description: 'Chuck' },
    torque: { type: ['number', 'null'], description: 'Torque' },
    serial: { type: 'string', description: 'Serial', readOnly: true },
  },
  required: ['chuck'],
}

const loaded = {
  id: 'drills',
  parentId: 'machines',
  code: 'DRL',
  localizedName: { en: 'Drills' },
  localizedDescription: { en: 'All drills' },
  position: 3,
  validity: {},
  published: true,
  type: 'CLASSIFICATION',
  metadata: { version: 7 },
  ownClassificationMixins: [],
}

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  onError: () => {
    // NOOP
  },
})

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="search">{location.search}</div>
    </>
  )
}

/** The remote's routes; `hashRouter` for code that reads the live hash (tabs). */
const renderDetail = (path: string, { hashRouter = false } = {}) => {
  if (hashRouter) window.location.hash = `#${path}`
  const Router = ({ children }: { children: ReactNode }) =>
    hashRouter ? (
      <HashRouter>{children}</HashRouter>
    ) : (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    )
  const tree = (tenant: string) => (
    <DashboardProvider appState={appStateFor(tenant)}>
      <Router>
        <Routes>
          <Route path="/" element={<div>list</div>} />
          <Route path="/add" element={<ClassificationAddEditRoute />} />
          <Route
            path="/:classificationId"
            element={<ClassificationAddEditRoute />}
          />
        </Routes>
        <LocationDisplay />
      </Router>
    </DashboardProvider>
  )
  const result = render(tree('tnt'))
  return {
    ...result,
    switchTenant: (tenant: string) => result.rerender(tree(tenant)),
  }
}

const inputIn = (testId: string) => {
  const input = screen
    .getByTestId(testId)
    .querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
  if (!input) throw new Error(`no input in ${testId}`)
  return input
}
const button = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement
const type = (element: Element, value: string) =>
  fireEvent.change(element, { target: { value } })
const location = () => screen.getByTestId('location').textContent
const tab = (id: string) => button(`classification-tabs-tab-${id}`)
const selectOption = (testId: string, index: number) => {
  fireEvent.click(screen.getByTestId(`${testId}-control`))
  fireEvent.mouseDown(screen.getByTestId(`${testId}-option-${index}`))
}
/**
 * Body rows of a tile's attribute table as arrays of cell texts. Read from the
 * markup: the tiles sit in a tab panel that is hidden while another tab is open.
 */
const attributeRows = (tileIndex: number) =>
  [
    ...screen
      .getByTestId(`classification-schema-${tileIndex}-attributes`)
      .querySelectorAll('tbody tr'),
  ]
    .map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent)
    )
    .filter((cells) => cells.length > 1)
const fieldError = (testId: string) =>
  within(screen.getByTestId(testId)).findByRole('alert', { hidden: true })
const isTabOpen = (id: string) =>
  !screen.getByTestId(`classification-tabs-panel-${id}`).hidden
const saveEnabled = () =>
  waitFor(() => expect(button('classification-save').disabled).toBe(false))
const fillRequiredDetails = () => {
  type(inputIn('classification-name'), 'Drills')
  type(inputIn('classification-code'), 'DRL')
}
const fetchMock = vi.fn()

describe('Classification add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.CATEGORIES_VIEWER,
      EmployeeDomains.CATEGORIES_MANAGER,
    ]
    vi.mocked(fetchCategory).mockResolvedValue(loaded as never)
    vi.mocked(createNewCategory).mockResolvedValue('drills')
    vi.mocked(modifyCategory).mockResolvedValue({} as never)
    vi.mocked(rebuildCategoryTreeCall).mockResolvedValue({} as never)
    vi.mocked(getSchemasCall).mockResolvedValue([toolsSchema] as never)
    vi.mocked(getSchemaCall).mockResolvedValue(oldToolsSchema as never)
    // `machines` and `garden` are roots (404); everything else hangs below `machines`.
    vi.mocked(getCategoryParentsCall).mockImplementation(
      async (_tenant, id) => {
        if (id === 'machines' || id === 'garden') {
          throw { response: { status: 404 } }
        }
        return [{ id: 'machines' }] as never
      }
    )
    fetchMock.mockResolvedValue({ json: async () => ownSchema })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    window.location.hash = ''
  })

  describe('create', () => {
    it('creates a published classification, rebuilds its tree and opens it', async () => {
      renderDetail('/add')

      expect(button('classification-save').disabled).toBe(true)
      fillRequiredDetails()
      type(inputIn('classification-description'), 'All drills')
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() => expect(location()).toBe('/drills'))
      expect(createNewCategory).toHaveBeenCalledWith('tnt', {
        localizedName: { en: 'Drills' },
        code: 'DRL',
        localizedDescription: { en: 'All drills' },
        position: 0,
        published: true,
        ownClassificationMixins: [],
        type: 'CLASSIFICATION',
      })
      expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'machines')
      expect(toast.showSuccess).toHaveBeenCalledWith(
        'Classification created successfully'
      )
    })

    it('needs a name and a code before it can be saved', async () => {
      renderDetail('/add')

      type(inputIn('classification-name'), 'Drills')
      await waitFor(() =>
        expect(button('classification-discard').disabled).toBe(false)
      )
      expect(button('classification-save').disabled).toBe(true)

      type(inputIn('classification-code'), 'DRL')
      await saveEnabled()
    })

    it('creates nothing and reports the conflict for a code that exists', async () => {
      vi.mocked(createNewCategory).mockRejectedValue({
        response: { status: 409, data: { message: 'Conflict' } },
      })
      renderDetail('/add')

      fillRequiredDetails()
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to create classification',
          'Classification with provided code already exists'
        )
      )
      expect(location()).toBe('/add')
      expect(rebuildCategoryTreeCall).not.toHaveBeenCalled()
      expect(toast.showSuccess).not.toHaveBeenCalled()
    })

    it('reports the server message when creating fails for another reason', async () => {
      vi.mocked(createNewCategory).mockRejectedValue({
        response: { status: 400, data: { message: 'Code is too long' } },
      })
      renderDetail('/add')

      fillRequiredDetails()
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to create classification',
          'Code is too long'
        )
      )
      expect(location()).toBe('/add')
    })

    it('discards the entered values', async () => {
      renderDetail('/add')

      fillRequiredDetails()
      await saveEnabled()
      fireEvent.click(button('classification-discard'))

      await waitFor(() => expect(inputIn('classification-code').value).toBe(''))
      expect(inputIn('classification-name').value).toBe('')
      expect(button('classification-save').disabled).toBe(true)
      expect(button('classification-discard').disabled).toBe(true)
    })
  })

  describe('edit', () => {
    it('shows the loaded classification with a read-only code', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')

      expect(fetchCategory).toHaveBeenCalledWith('tnt', 'drills')
      expect(inputIn('classification-name').value).toBe('Drills')
      expect(inputIn('classification-code').value).toBe('DRL')
      expect(inputIn('classification-code').readOnly).toBe(true)
      expect(inputIn('classification-description').tagName).toBe('TEXTAREA')
      expect(inputIn('classification-description').value).toBe('All drills')
      expect(inputIn('classification-position').value).toBe('3')
      const parent = screen.getByTestId('classification-parent')
      expect(parent.textContent).toBe('machines')
      expect(parent.dataset.type).toBe('CLASSIFICATION')
      expect(parent.dataset.unpublished).toBe('false')
      expect(button('classification-save').disabled).toBe(true)
    })

    it('updates a moved classification and rebuilds the old and the new root', async () => {
      // Once saved, `drills` hangs below its new parent `garden`, a root itself.
      vi.mocked(getCategoryParentsCall).mockImplementation(
        async (_tenant, id) => {
          if (id === 'machines' || id === 'garden') {
            throw { response: { status: 404 } }
          }
          return [
            {
              id: vi.mocked(modifyCategory).mock.calls.length
                ? 'garden'
                : 'machines',
            },
          ] as never
        }
      )
      renderDetail('/drills')
      await screen.findByText('Drills')

      type(inputIn('classification-name'), 'Power drills')
      fireEvent.click(screen.getByTestId('classification-parent'))
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith(
          'Classification updated successfully'
        )
      )
      expect(modifyCategory).toHaveBeenCalledWith('tnt', {
        id: 'drills',
        code: 'DRL',
        localizedName: { en: 'Power drills' },
        localizedDescription: { en: 'All drills' },
        parentId: 'garden',
        position: 3,
        published: true,
        type: 'CLASSIFICATION',
        metadata: { version: 7 },
        ownClassificationMixins: [],
      })
      const rebuilt = vi
        .mocked(rebuildCategoryTreeCall)
        .mock.calls.map(([, root]) => root)
      // The new root of `drills` first, then its old parent `machines` (a root).
      expect(rebuilt).toEqual(['garden', 'machines'])
      // The page reloads the saved classification and is clean again.
      await waitFor(() => expect(fetchCategory).toHaveBeenCalledTimes(2))
      await waitFor(() =>
        expect(button('classification-save').disabled).toBe(true)
      )
    })

    it('rebuilds only its own root when the parent stays', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')

      type(inputIn('classification-name'), 'Power drills')
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() => expect(toast.showSuccess).toHaveBeenCalled())
      expect(rebuildCategoryTreeCall).toHaveBeenCalledTimes(1)
      expect(rebuildCategoryTreeCall).toHaveBeenCalledWith('tnt', 'machines')
    })

    it('warns once when the classification is saved but its tree cannot be rebuilt', async () => {
      vi.mocked(rebuildCategoryTreeCall).mockRejectedValue(new Error('down'))
      renderDetail('/drills')
      await screen.findByText('Drills')

      type(inputIn('classification-name'), 'Power drills')
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(toast.showToast).toHaveBeenCalledWith(
          'Classification updated successfully',
          'The category tree could not be refreshed',
          'warn'
        )
      )
      expect(toast.showSuccess).not.toHaveBeenCalled()
      expect(toast.showError).not.toHaveBeenCalled()
    })

    it('reports a failed update and keeps the edits', async () => {
      vi.mocked(modifyCategory).mockRejectedValue({
        response: { status: 400, data: { message: 'Version conflict' } },
      })
      renderDetail('/drills')
      await screen.findByText('Drills')

      type(inputIn('classification-name'), 'Power drills')
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to update classification',
          'Version conflict'
        )
      )
      expect(inputIn('classification-name').value).toBe('Power drills')
      expect(rebuildCategoryTreeCall).not.toHaveBeenCalled()
    })

    it('clears the validity dates when the classification is always valid', async () => {
      vi.mocked(fetchCategory).mockResolvedValue({
        ...loaded,
        validity: {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-12-31T00:00:00.000Z',
        },
      } as never)
      renderDetail('/drills')
      await screen.findByText('Drills')

      const validityType = screen.getByTestId(
        'classification-validity-type-control'
      )
      await waitFor(() => expect(validityType.textContent).toContain('Custom'))
      expect(inputIn('classification-valid-from').disabled).toBe(false)

      // Options: custom, always.
      selectOption('classification-validity-type', 1)
      await saveEnabled()
      expect(inputIn('classification-valid-from').disabled).toBe(true)
      expect(inputIn('classification-valid-to').disabled).toBe(true)
      fireEvent.click(button('classification-save'))

      await waitFor(() => expect(modifyCategory).toHaveBeenCalled())
      const [, payload] = vi.mocked(modifyCategory).mock.calls[0]
      expect(payload).not.toHaveProperty('validity')
    })

    it('saves an unpublished classification', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')

      fireEvent.click(screen.getByTestId('classification-published-input'))
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(modifyCategory).toHaveBeenCalledWith(
          'tnt',
          expect.objectContaining({ id: 'drills', published: false })
        )
      )
    })
  })

  describe('tabs', () => {
    it('shows details, classification, path and validity in that order', async () => {
      renderDetail('/add')

      const labels = ['details', 'classification', 'path', 'validity'].map(
        (id) => tab(id).textContent
      )
      expect(labels).toEqual(['Details', 'Classification', 'Path', 'Validity'])
      expect(
        [
          ...screen
            .getByTestId('classification-tabs')
            .querySelectorAll('[data-testid^="classification-tabs-tab-"]'),
        ].map((element) => element.getAttribute('data-testid'))
      ).toEqual([
        'classification-tabs-tab-details',
        'classification-tabs-tab-classification',
        'classification-tabs-tab-path',
        'classification-tabs-tab-validity',
      ])
    })

    it('keeps the open tab in the address', async () => {
      renderDetail('/add', { hashRouter: true })

      expect(isTabOpen('details')).toBe(true)
      fireEvent.click(tab('path'))

      await waitFor(() => expect(isTabOpen('path')).toBe(true))
      expect(screen.getByTestId('search').textContent).toContain('tab=path')
    })

    it('opens the tab named in the address', async () => {
      renderDetail('/add?tab=validity', { hashRouter: true })

      await waitFor(() => expect(isTabOpen('validity')).toBe(true))
    })

    it('opens the tab of a link that carries the tab position', async () => {
      renderDetail('/add?tab=1', { hashRouter: true })

      await waitFor(() => expect(isTabOpen('classification')).toBe(true))
      expect(screen.getByTestId('search').textContent).toContain(
        'tab=classification'
      )
    })
  })

  describe('schema tiles', () => {
    it('starts without a schema and adds a collapsed tile', async () => {
      renderDetail('/add')

      expect(
        screen.getByText('No classification schema has been defined yet.')
      ).toBeTruthy()
      fireEvent.click(button('classification-schema-add'))

      const toggle = await screen.findByTestId('classification-schema-0-toggle')
      expect(toggle.textContent).toBe('New Classification Schema')
      expect(toggle.getAttribute('aria-expanded')).toBe('false')
      expect(
        screen.queryByText('No classification schema has been defined yet.')
      ).toBeNull()
      expect(inputIn('classification-schema-0-key').value).toBe(
        'newClassificationSchema'
      )
      expect(getSchemasCall).toHaveBeenCalledWith('tnt', 'CLASSIFICATION')

      fireEvent.click(toggle)
      expect(toggle.getAttribute('aria-expanded')).toBe('true')
    })

    it('stores an Emporix schema with its key, url and required flag', async () => {
      renderDetail('/add')
      fillRequiredDetails()
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')

      // A tile without a schema url cannot be saved.
      await waitFor(() =>
        expect(button('classification-discard').disabled).toBe(false)
      )
      expect(button('classification-save').disabled).toBe(true)

      await waitFor(() =>
        expect(getSchemasCall).toHaveBeenCalledWith('tnt', 'CLASSIFICATION')
      )
      selectOption('classification-schema-0-schema', 0)

      await waitFor(() =>
        expect(inputIn('classification-schema-0-key').value).toBe('tools')
      )
      expect(inputIn('classification-schema-0-url').value).toBe(
        toolsSchema.metadata.url
      )
      expect(
        screen.getByTestId('classification-schema-0-toggle').textContent
      ).toBe('Tools')
      // name, read only, nullable, required, localized
      await waitFor(() =>
        expect(attributeRows(0)).toEqual([
          ['voltage', '', '', 'Yes', ''],
          ['colour', '', 'Yes', '', ''],
          ['weight', '', '', '', ''],
        ])
      )

      // The url of an Emporix schema follows the picked schema only.
      type(
        inputIn('classification-schema-0-url'),
        'https://x.example.com/a.json'
      )
      expect(inputIn('classification-schema-0-url').value).toBe(
        toolsSchema.metadata.url
      )

      fireEvent.click(
        screen.getByTestId('classification-schema-0-required-input')
      )
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() => expect(location()).toBe('/drills'))
      expect(createNewCategory).toHaveBeenCalledWith(
        'tnt',
        expect.objectContaining({
          type: 'CLASSIFICATION',
          ownClassificationMixins: [
            {
              required: true,
              schemaUrl: toolsSchema.metadata.url,
              name: 'tools',
            },
          ],
        })
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('stores an own schema and lists its attributes with the nullable ones', async () => {
      renderDetail('/add')
      fillRequiredDetails()
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')

      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))
      // Own schemas have no schema picker and start empty.
      await waitFor(() =>
        expect(
          screen.queryByTestId('classification-schema-0-schema')
        ).toBeNull()
      )
      expect(inputIn('classification-schema-0-key').value).toBe('')
      expect(inputIn('classification-schema-0-url').value).toBe('')

      type(inputIn('classification-schema-0-key'), 'my drill-key_1!')
      expect(inputIn('classification-schema-0-key').value).toBe('mydrillkey_1')
      type(inputIn('classification-schema-0-url'), OWN_SCHEMA_URL)

      await waitFor(() =>
        expect(attributeRows(0)).toEqual([
          ['chuck', '', '', 'Yes', ''],
          ['torque', '', 'Yes', '', ''],
          ['serial', 'Yes', '', '', ''],
        ])
      )
      expect(fetchMock).toHaveBeenCalledWith(
        OWN_SCHEMA_URL,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )

      await saveEnabled()
      fireEvent.click(button('classification-save'))

      await waitFor(() => expect(location()).toBe('/drills'))
      expect(createNewCategory).toHaveBeenCalledWith(
        'tnt',
        expect.objectContaining({
          ownClassificationMixins: [
            {
              required: false,
              schemaUrl: OWN_SCHEMA_URL,
              name: 'mydrillkey_1',
            },
          ],
        })
      )
    })

    it('blocks saving with the field error for an invalid url or an empty key', async () => {
      renderDetail('/add')
      fillRequiredDetails()
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')
      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))

      type(inputIn('classification-schema-0-key'), 'drill')
      type(inputIn('classification-schema-0-url'), 'ftp://schemas/drills')

      const urlError = await fieldError('classification-schema-0-url')
      expect(urlError.textContent).toBe(
        'Url needs to start with "http://" or "https://" and points to a valid JSON schema.'
      )
      expect(button('classification-save').disabled).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(attributeRows(0)).toEqual([])

      type(inputIn('classification-schema-0-url'), OWN_SCHEMA_URL)
      await saveEnabled()
      expect(
        within(screen.getByTestId('classification-schema-0-url')).queryByRole(
          'alert',
          { hidden: true }
        )
      ).toBeNull()

      // Only characters that are not allowed: nothing is left of the key.
      type(inputIn('classification-schema-0-key'), '-!-')
      const keyError = await fieldError('classification-schema-0-key')
      expect(keyError.textContent).toContain('Key must use a simple')
      expect(inputIn('classification-schema-0-key').value).toBe('')
      expect(button('classification-save').disabled).toBe(true)
      expect(createNewCategory).not.toHaveBeenCalled()
    })

    it('shows no attributes when the own schema cannot be read', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))
      renderDetail('/add')
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')
      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))

      type(inputIn('classification-schema-0-url'), OWN_SCHEMA_URL)

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(
        await screen.findByText('No fields in this schema yet')
      ).toBeTruthy()
    })

    it('keeps the attributes of the last url when an earlier answer arrives late', async () => {
      const slowUrl = 'https://schemas.example.com/slow.json'
      let answerSlow: (value: unknown) => void = () => undefined
      fetchMock.mockImplementation((url: string) =>
        url === slowUrl
          ? new Promise((resolve) => {
              answerSlow = resolve
            })
          : Promise.resolve({ json: async () => ownSchema })
      )
      renderDetail('/add')
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')
      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))

      type(inputIn('classification-schema-0-url'), slowUrl)
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
      type(inputIn('classification-schema-0-url'), OWN_SCHEMA_URL)
      await waitFor(() => expect(attributeRows(0)).toHaveLength(3))

      answerSlow({
        json: async () => ({ properties: { late: { type: 'string' } } }),
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(attributeRows(0).map(([name]) => name)).toEqual([
        'chuck',
        'torque',
        'serial',
      ])
    })

    it('remembers the Emporix and the own schema when switching between them', async () => {
      renderDetail('/add')
      fireEvent.click(button('classification-schema-add'))
      await screen.findByTestId('classification-schema-0-toggle')
      await waitFor(() => expect(getSchemasCall).toHaveBeenCalled())
      selectOption('classification-schema-0-schema', 0)
      await waitFor(() =>
        expect(inputIn('classification-schema-0-key').value).toBe('tools')
      )

      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))
      await waitFor(() =>
        expect(inputIn('classification-schema-0-key').value).toBe('')
      )
      type(inputIn('classification-schema-0-key'), 'drill')
      type(inputIn('classification-schema-0-url'), OWN_SCHEMA_URL)

      fireEvent.click(
        screen.getByTestId('classification-schema-0-emporix-input')
      )
      await waitFor(() =>
        expect(inputIn('classification-schema-0-key').value).toBe('tools')
      )
      expect(inputIn('classification-schema-0-url').value).toBe(
        toolsSchema.metadata.url
      )

      fireEvent.click(screen.getByTestId('classification-schema-0-own-input'))
      await waitFor(() =>
        expect(inputIn('classification-schema-0-key').value).toBe('drill')
      )
      expect(inputIn('classification-schema-0-url').value).toBe(OWN_SCHEMA_URL)
    })

    it('removes a tile from the saved classification', async () => {
      vi.mocked(fetchCategory).mockResolvedValue({
        ...loaded,
        ownClassificationMixins: [
          { name: 'drill', required: true, schemaUrl: OWN_SCHEMA_URL },
        ],
      } as never)
      renderDetail('/drills')
      await screen.findByText('Drills')
      expect(
        (await screen.findByTestId('classification-schema-0-toggle'))
          .textContent
      ).toBe('Drill')
      // A saved own schema is recognised as such.
      await waitFor(() =>
        expect(
          (
            screen.getByTestId(
              'classification-schema-0-own-input'
            ) as HTMLInputElement
          ).checked
        ).toBe(true)
      )

      fireEvent.click(button('classification-schema-0-delete'))
      await saveEnabled()
      expect(screen.queryByTestId('classification-schema-0')).toBeNull()
      fireEvent.click(button('classification-save'))

      await waitFor(() =>
        expect(modifyCategory).toHaveBeenCalledWith(
          'tnt',
          expect.objectContaining({ ownClassificationMixins: [] })
        )
      )
    })
  })

  describe('outdated schema', () => {
    const outdated = {
      ...loaded,
      ownClassificationMixins: [
        {
          name: 'tools',
          required: false,
          schemaUrl: oldToolsSchema.metadata.url,
        },
      ],
    }
    const versionBadge = () =>
      screen.queryByTestId('classification-schema-0-version')

    beforeEach(() => {
      vi.mocked(fetchCategory).mockResolvedValue(outdated as never)
    })

    it('marks the tile with the new version and the tab with an alert', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')

      await waitFor(() => expect(versionBadge()?.textContent).toBe('v2'))
      expect(tab('classification').textContent).toBe('Classification (!)')
      expect(getSchemaCall).toHaveBeenCalledWith('tnt', 'tools', 1)
      expect(inputIn('classification-schema-0-url').value).toBe(
        oldToolsSchema.metadata.url
      )
      // Nothing changed yet for the operator to save.
      expect(button('classification-save').disabled).toBe(true)
    })

    it('shows the differences to the new version and the old attributes', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')

      // Type changed, flag changed, added, deleted.
      await waitFor(() =>
        expect(attributeRows(0)).toEqual([
          ['Changedvoltage', '', '', 'Yes', ''],
          ['colour', '', 'ChangedYes', '', ''],
          ['Addedweight', '', '', '', ''],
          ['Deletedlength', '', '', '', ''],
        ])
      )

      fireEvent.click(button('classification-schema-0-keep-old'))
      await waitFor(() =>
        expect(attributeRows(0)).toEqual([
          ['voltage', '', '', 'Yes', ''],
          ['colour', '', '', '', ''],
          ['length', '', '', '', ''],
        ])
      )
      // Looking at the old attributes keeps the schema outdated.
      expect(versionBadge()?.textContent).toBe('v2')

      fireEvent.click(button('classification-schema-0-new-version'))
      await waitFor(() => expect(attributeRows(0)).toHaveLength(4))
      expect(getSchemaCall).toHaveBeenCalledTimes(1)
    })

    it('switches the tile to the new version and clears the badges', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')
      await waitFor(() => expect(versionBadge()?.textContent).toBe('v2'))

      expect(button('classification-schema-0-apply-version').textContent).toBe(
        'Apply Version 2'
      )
      fireEvent.click(button('classification-schema-0-apply-version'))

      await waitFor(() => expect(versionBadge()).toBeNull())
      expect(tab('classification').textContent).toBe('Classification')
      expect(inputIn('classification-schema-0-url').value).toBe(
        toolsSchema.metadata.url
      )
      expect(
        screen.queryByTestId('classification-schema-0-apply-version')
      ).toBeNull()
      await waitFor(() =>
        expect(attributeRows(0)).toEqual([
          ['voltage', '', '', 'Yes', ''],
          ['colour', '', 'Yes', '', ''],
          ['weight', '', '', '', ''],
        ])
      )

      await saveEnabled()
      fireEvent.click(button('classification-save'))
      await waitFor(() =>
        expect(modifyCategory).toHaveBeenCalledWith(
          'tnt',
          expect.objectContaining({
            ownClassificationMixins: [
              {
                name: 'tools',
                required: false,
                schemaUrl: toolsSchema.metadata.url,
              },
            ],
          })
        )
      )
    })

    it('shows the new attributes when the old version cannot be loaded', async () => {
      vi.mocked(getSchemaCall).mockRejectedValue(new Error('gone'))
      renderDetail('/drills')
      await screen.findByText('Drills')

      await waitFor(() =>
        expect(attributeRows(0).map(([name]) => name)).toEqual([
          'voltage',
          'colour',
          'weight',
        ])
      )
      expect(versionBadge()).toBeNull()
      expect(tab('classification').textContent).toBe('Classification')
    })

    it('drops the alert on the tab when the outdated tile is removed', async () => {
      renderDetail('/drills')
      await screen.findByText('Drills')
      await waitFor(() =>
        expect(tab('classification').textContent).toBe('Classification (!)')
      )

      fireEvent.click(button('classification-schema-0-delete'))

      await waitFor(() =>
        expect(tab('classification').textContent).toBe('Classification')
      )
    })
  })

  describe('loading', () => {
    it('reports a classification that cannot be loaded and opens the list', async () => {
      vi.mocked(fetchCategory).mockRejectedValue({
        response: { status: 404, data: { message: 'Not found' } },
      })
      renderDetail('/missing')

      await waitFor(() => expect(location()).toBe('/'))
      expect(screen.getByText('list')).toBeTruthy()
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading classification.',
        'Not found'
      )
    })

    it('opens the list when the tenant changes', async () => {
      const { switchTenant } = renderDetail('/drills')
      await screen.findByText('Drills')

      switchTenant('other')

      await waitFor(() => expect(location()).toBe('/'))
    })

    it('loads the other classification when the address changes', async () => {
      vi.mocked(createNewCategory).mockResolvedValue('saws')
      vi.mocked(fetchCategory).mockResolvedValue({
        ...loaded,
        id: 'saws',
        code: 'SAW',
        localizedName: { en: 'Saws' },
      } as never)
      renderDetail('/add')

      fillRequiredDetails()
      await saveEnabled()
      fireEvent.click(button('classification-save'))

      // The created classification replaces the entered values.
      await screen.findByText('Saws')
      expect(fetchCategory).toHaveBeenCalledWith('tnt', 'saws')
      await waitFor(() =>
        expect(inputIn('classification-code').value).toBe('SAW')
      )
      expect(inputIn('classification-code').readOnly).toBe(true)
      expect(button('classification-save').disabled).toBe(true)
    })
  })

  describe('viewer', () => {
    it('has every field read-only and cannot save or discard', async () => {
      permissions.granted = [EmployeeDomains.CATEGORIES_VIEWER]
      vi.mocked(fetchCategory).mockResolvedValue({
        ...loaded,
        ownClassificationMixins: [
          {
            name: 'tools',
            required: false,
            schemaUrl: oldToolsSchema.metadata.url,
          },
        ],
      } as never)
      renderDetail('/drills')
      await screen.findByText('Drills')
      await screen.findByTestId('classification-schema-0-apply-version')

      expect(inputIn('classification-name').disabled).toBe(true)
      expect(inputIn('classification-description').disabled).toBe(true)
      expect(inputIn('classification-code').readOnly).toBe(true)
      expect(inputIn('classification-position').readOnly).toBe(true)
      const disabledInputs = [
        'classification-published-input',
        'classification-schema-0-emporix-input',
        'classification-schema-0-own-input',
        'classification-schema-0-required-input',
      ].map(
        (testId) => (screen.getByTestId(testId) as HTMLInputElement).disabled
      )
      expect(disabledInputs).toEqual([true, true, true, true])
      expect(inputIn('classification-valid-from').disabled).toBe(true)
      expect(inputIn('classification-valid-to').disabled).toBe(true)
      expect(inputIn('classification-schema-0-key').readOnly).toBe(true)
      expect(inputIn('classification-schema-0-url').readOnly).toBe(true)
      const disabledButtons = [
        'classification-schema-add',
        'classification-schema-0-delete',
        'classification-schema-0-apply-version',
        'classification-save',
        'classification-discard',
      ].map((testId) => button(testId).disabled)
      expect(disabledButtons).toEqual([true, true, true, true, true])
      for (const testId of [
        'classification-validity-type-control',
        'classification-schema-0-schema-control',
      ]) {
        const control = screen.getByTestId(testId)
        expect(
          control.getAttribute('aria-disabled') === 'true' ||
            (control as HTMLButtonElement).disabled
        ).toBe(true)
      }
    })
  })
})
