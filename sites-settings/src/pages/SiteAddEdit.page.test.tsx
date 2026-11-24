/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  createSiteCall,
  getSiteCall,
  listCountriesCall,
  listPaymentModesCall,
  patchSiteCall,
  updateSiteCall,
} from '@emporix/api-calls/next'
import { fetchCurrencies } from '@emporix/api-calls'
import type { TabItem } from '@emporix/component-library'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { renderAt } from '../test/renderWithRouter'
import SiteAddEditPage, {
  EXCLUDED_MIXIN_IDS,
  FILTER_SITE_MIXINS_FEATURE_TOGGLE,
} from './SiteAddEdit.page'

type MixinsProps = {
  type: string
  onEdit: (data: unknown, metadata: { key: string; url: string }) => unknown
  managerPermissions?: boolean
}

const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const toggles = vi.hoisted(() => ({ valid: [] as string[] }))
const mixins = vi.hoisted(() => ({
  loadMixins: vi.fn(),
  tabs: [] as TabItem[],
  props: undefined as MixinsProps | undefined,
}))

vi.mock('@emporix/api-calls/next', () => ({
  listSitesCall: vi.fn(),
  getSiteCall: vi.fn(),
  createSiteCall: vi.fn(),
  updateSiteCall: vi.fn(),
  patchSiteCall: vi.fn(),
  deleteSiteCall: vi.fn(),
  listCountriesCall: vi.fn(),
  listPaymentModesCall: vi.fn(),
  fetchAll: vi.fn(
    async (
      list: (p: unknown, o: unknown) => Promise<{ values: unknown[] }>,
      params: unknown,
      options: unknown
    ) => (await list(params, options)).values
  ),
}))

vi.mock('@emporix/api-calls', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/api-calls')>()),
  fetchCurrencies: vi.fn(),
}))

vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
  }),
}))

vi.mock('../context/FeatureTogglesProvider', () => ({
  useFeatureToggles: () => ({
    isToggleValid: (code: string) => toggles.valid.includes(code),
  }),
}))

vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    languages: [
      { id: 'en', label: 'English' },
      { id: 'de', label: 'German' },
    ],
    currentCurrency: undefined,
  }),
}))

vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: (props: MixinsProps) => {
    mixins.props = props
    return {
      loadMixins: mixins.loadMixins,
      isMixinsLoading: false,
      mixinsTabs: mixins.tabs,
      mixinsForms: [],
    }
  },
}))

vi.mock('../components/auditLog/EntityChangelogTab', () => ({
  default: ({ entity, entityId }: { entity: string; entityId: string }) => (
    <div data-testid="changelog">{`${entity}:${entityId}`}</div>
  ),
}))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const MANAGER = [EmployeeDomains.SITES_VIEWER, EmployeeDomains.SITES_MANAGER]

const site = {
  code: 'main',
  name: 'Main shop',
  active: true,
  default: true,
  defaultLanguage: 'en',
  languages: ['en', 'de'],
  currency: 'EUR',
  shipToCountries: ['DE'],
  payment: [],
  taxDeterminationBasedOn: 'BILLING_ADDRESS' as const,
  cartCalculationScale: 2,
  assistedBuying: { storefrontUrl: '' },
  homeBase: {
    address: { country: 'DE', zipCode: '10115', city: 'Berlin' },
    location: {},
    timezone: 'Europe/Berlin',
  },
  mixins: { general: { logo: 'a.png' } },
  metadata: { version: 1, mixins: { general: 'https://schema/general' } },
}

const onSitesChanged = vi.fn()

const renderPage = (path: string) =>
  renderAt(
    path,
    { list: <div>list</div>, detail: <SiteAddEditPage /> },
    'tenant-a',
    { onSitesChanged }
  )

const saveButton = () => screen.getByTestId('site-save') as HTMLButtonElement
const inputIn = (testId: string) => {
  const element = screen.getByTestId(testId)
  const input =
    element instanceof HTMLInputElement
      ? element
      : element.querySelector('input, textarea')
  if (!input) throw new Error(`no input in ${testId}`)
  return input as HTMLInputElement
}
const type = (testId: string, value: string) =>
  fireEvent.change(inputIn(testId), { target: { value } })
const pickOption = (testId: string, label: string) => {
  fireEvent.click(screen.getByTestId(`${testId}-control`))
  const option = screen
    .getAllByTestId(new RegExp(`^${testId}-option-\\d+$`))
    .find((element) => element.textContent?.includes(label))
  if (!option) throw new Error(`no option ${label} in ${testId}`)
  fireEvent.mouseDown(option)
}
const closePanel = (testId: string) =>
  fireEvent.click(screen.getByTestId(`${testId}-control`))
const location = () => screen.getByTestId('location').textContent
const siteLoaded = () =>
  waitFor(() => expect(inputIn('name-input').value).toBe('Main shop'))

describe('Site add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [...MANAGER]
    toggles.valid = []
    mixins.tabs = []
    mixins.props = undefined
    vi.mocked(getSiteCall).mockImplementation(
      async () => structuredClone(site) as never
    )
    vi.mocked(createSiteCall).mockResolvedValue({ id: 'new' })
    vi.mocked(updateSiteCall).mockResolvedValue()
    vi.mocked(patchSiteCall).mockResolvedValue()
    vi.mocked(listCountriesCall).mockResolvedValue({
      values: [
        { code: 'DE', name: { en: 'Germany' }, active: true },
        { code: 'PL', name: { en: 'Poland' }, active: true },
        { code: 'XX', name: { en: 'Nowhere' }, active: false },
      ] as never,
      totalRecords: 3,
    })
    vi.mocked(listPaymentModesCall).mockResolvedValue([
      { id: 'pm1', code: 'INVOICE', active: true, provider: 'INVOICE' },
    ] as never)
    vi.mocked(fetchCurrencies).mockResolvedValue([
      { code: 'EUR', name: { en: 'Euro' } },
      { code: 'PLN', name: { en: 'Zloty' } },
    ] as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Scenario 3: create', () => {
    it('creates the site from the required fields, opens it and tells the host', async () => {
      renderPage('/add')
      await waitFor(() => expect(listCountriesCall).toHaveBeenCalled())

      type('name-input', 'Polish shop')
      type('code-input', 'pl')
      pickOption('languages', 'English')
      closePanel('languages')
      pickOption('default-language', 'English')
      pickOption('ship-to-countries', 'Poland')
      closePanel('ship-to-countries')
      pickOption('currency', 'PLN')
      pickOption('country', 'Poland')

      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() => expect(createSiteCall).toHaveBeenCalledTimes(1))
      expect(vi.mocked(createSiteCall).mock.calls[0]).toEqual([
        expect.objectContaining({
          code: 'pl',
          name: 'Polish shop',
          languages: ['en'],
          defaultLanguage: 'en',
          shipToCountries: ['PL'],
          currency: 'PLN',
          active: true,
          default: false,
          taxDeterminationBasedOn: 'BILLING_ADDRESS',
          cartCalculationScale: 2,
          homeBase: expect.objectContaining({
            address: expect.objectContaining({ country: 'PL' }),
          }),
        }),
        { tenant: 'tenant-a' },
      ])
      await waitFor(() => expect(location()).toBe('/new'))
      expect(toast.showSuccess).toHaveBeenCalledWith('Site created!')
      expect(onSitesChanged).toHaveBeenCalledTimes(1)
    })

    it('offers only active countries as ship-to countries', async () => {
      renderPage('/add')
      await waitFor(() => expect(listCountriesCall).toHaveBeenCalled())
      fireEvent.click(screen.getByTestId('ship-to-countries-control'))
      const labels = screen
        .getAllByTestId(/^ship-to-countries-option-\d+$/)
        .map((option) => option.textContent)
      expect(labels).toEqual(['Germany', 'Poland'])
    })

    it('keeps Save disabled until the required fields are set', async () => {
      renderPage('/add')
      type('name-input', 'Only a name')
      await waitFor(() => expect(saveButton().disabled).toBe(true))
      expect(screen.queryByTestId('site-tabs')).toBeNull()
    })
  })

  describe('Scenario 4: edit', () => {
    it('saves the whole site with the changes, reloads it and tells the host', async () => {
      renderPage('/main')
      await siteLoaded()
      expect(getSiteCall).toHaveBeenCalledWith(
        'main',
        { expand: 'mixin:*' },
        { tenant: 'tenant-a' }
      )

      type('city-input', 'Munich')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() => expect(updateSiteCall).toHaveBeenCalledTimes(1))
      const [code, body, params, options] =
        vi.mocked(updateSiteCall).mock.calls[0]
      expect(code).toBe('main')
      expect(params).toBeUndefined()
      expect(options).toEqual({ tenant: 'tenant-a' })
      expect(body.homeBase.address.city).toBe('Munich')
      expect(body.mixins).toEqual(site.mixins)
      expect(body.metadata).toEqual(site.metadata)
      await waitFor(() => expect(getSiteCall).toHaveBeenCalledTimes(2))
      expect(toast.showSuccess).toHaveBeenCalledWith('Site updated')
      expect(onSitesChanged).toHaveBeenCalledTimes(1)
    })

    it('discards the changes back to the loaded site', async () => {
      renderPage('/main')
      await siteLoaded()
      type('name-input', 'Changed')
      const discard = screen.getByTestId('site-discard') as HTMLButtonElement
      await waitFor(() => expect(discard.disabled).toBe(false))
      fireEvent.click(discard)
      await waitFor(() => expect(inputIn('name-input').value).toBe('Main shop'))
    })
  })

  describe('Scenario 2: viewer is read-only', () => {
    it('makes the fields read-only and keeps Save disabled', async () => {
      permissions.granted = [EmployeeDomains.SITES_VIEWER]
      renderPage('/main')
      await siteLoaded()

      expect(inputIn('name-input').readOnly).toBe(true)
      expect(inputIn('city-input').readOnly).toBe(true)
      type('name-input', 'Changed')
      expect(saveButton().disabled).toBe(true)
      expect(mixins.props?.managerPermissions).toBe(false)
    })
  })

  describe('Scenario 7: mixins', () => {
    const mixinTab = (id: string): TabItem => ({
      id,
      label: id,
      content: <div>{`${id} form`}</div>,
    })

    it('loads the site mixins and shows a tab per schema', async () => {
      mixins.tabs = [mixinTab('general'), mixinTab('mapsApiKey')]
      renderPage('/main')
      await siteLoaded()

      expect(mixins.props?.type).toBe('SITE')
      expect(mixins.loadMixins).toHaveBeenCalledWith(
        site.metadata.mixins,
        site.mixins
      )
      expect(screen.getByTestId('site-tabs-tab-general')).toBeTruthy()
      expect(screen.getByTestId('site-tabs-tab-mapsApiKey')).toBeTruthy()
    })

    it('hides the excluded mixins while filter-site-mixins is on', async () => {
      toggles.valid = [FILTER_SITE_MIXINS_FEATURE_TOGGLE]
      mixins.tabs = [mixinTab('general'), ...EXCLUDED_MIXIN_IDS.map(mixinTab)]
      renderPage('/main')
      await siteLoaded()

      expect(screen.getByTestId('site-tabs-tab-general')).toBeTruthy()
      for (const id of EXCLUDED_MIXIN_IDS) {
        expect(screen.queryByTestId(`site-tabs-tab-${id}`)).toBeNull()
      }
    })

    it('patches a saved mixin, reloads the site and tells the host', async () => {
      renderPage('/main')
      await siteLoaded()

      await mixins.props?.onEdit(
        { colour: 'red' },
        { key: 'theme', url: 'https://schema/theme' }
      )

      expect(patchSiteCall).toHaveBeenCalledWith(
        'main',
        {
          mixins: { general: { logo: 'a.png' }, theme: { colour: 'red' } },
          metadata: { mixins: { theme: 'https://schema/theme' } },
        },
        { tenant: 'tenant-a' }
      )
      expect(toast.showSuccess).toHaveBeenCalledWith('Site updated')
      expect(onSitesChanged).toHaveBeenCalledTimes(1)
      expect(getSiteCall).toHaveBeenCalledTimes(2)
    })

    it('shows an error toast and does not tell the host when the mixin save fails', async () => {
      vi.mocked(patchSiteCall).mockRejectedValue(new Error('boom'))
      renderPage('/main')
      await siteLoaded()

      await mixins.props?.onEdit({}, { key: 'theme', url: 'u' })

      expect(toast.showError).toHaveBeenCalledWith(
        'Error while updating',
        undefined
      )
      expect(onSitesChanged).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 8: audit log', () => {
    it('shows the changelog of the site for an Audit Log Viewer', async () => {
      permissions.granted = [...MANAGER, EmployeeDomains.AUDIT_LOG_VIEWER]
      renderPage('/main')
      await siteLoaded()

      fireEvent.click(screen.getByTestId('site-tabs-tab-audit-log'))
      expect(screen.getByTestId('changelog').textContent).toBe('site:main')
    })

    it('has no changelog tab without the permission', async () => {
      renderPage('/main')
      await siteLoaded()
      expect(screen.queryByTestId('site-tabs-tab-audit-log')).toBeNull()
    })
  })

  describe('Scenario 9: form rules', () => {
    it('clears the default language when it is removed from the languages', async () => {
      vi.mocked(getSiteCall).mockImplementation(
        async () =>
          ({ ...structuredClone(site), defaultLanguage: 'de' }) as never
      )
      renderPage('/main')
      await siteLoaded()

      // Unselect German.
      pickOption('languages', 'German')
      closePanel('languages')

      await waitFor(() =>
        expect(
          screen.getByTestId('default-language').textContent
        ).not.toContain('German')
      )
      expect(saveButton().disabled).toBe(true)
    })
  })

  describe('Scenario 11: load and save errors', () => {
    it('shows a toast when the site does not load and keeps the page usable', async () => {
      vi.mocked(getSiteCall).mockRejectedValue(new Error('offline'))
      renderPage('/main')

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading site',
          undefined
        )
      )
      expect(screen.getByTestId('site-tabs')).toBeTruthy()
    })

    it('shows a toast when the payment methods do not load', async () => {
      vi.mocked(listPaymentModesCall).mockRejectedValue(new Error('offline'))
      renderPage('/add')
      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while loading payment methods',
          undefined
        )
      )
    })

    it('shows the API message when a save fails and does not tell the host', async () => {
      vi.mocked(updateSiteCall).mockRejectedValue({
        response: { status: 400, data: { message: 'Code taken' } },
      })
      renderPage('/main')
      await siteLoaded()
      type('city-input', 'Munich')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while updating',
          expect.stringContaining('Code taken')
        )
      )
      expect(onSitesChanged).not.toHaveBeenCalled()
    })

    it('shows a toast when a save fails without a response', async () => {
      vi.mocked(updateSiteCall).mockRejectedValue(new Error('network'))
      renderPage('/main')
      await siteLoaded()
      type('city-input', 'Munich')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          'Error while updating',
          undefined
        )
      )
    })
  })
})
