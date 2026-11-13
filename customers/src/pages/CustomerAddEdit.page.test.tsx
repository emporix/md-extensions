/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { HashRouter, Route, Routes, useLocation } from 'react-router'
import i18n from '../translations/i18n'
import { EmployeeDomains } from '../configs/accessControls'
import { DashboardProvider } from '../context/Dashboard.context'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import type { AppState } from '../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../constants/currency'
import CustomerAddEditPage from './CustomerAddEdit.page'

type MixinsProps = {
  type: string
  onEdit: (data: unknown, meta: { key: string; url: string }) => unknown
}

const api = vi.hoisted(() => ({
  syncCustomer: vi.fn(),
  editCustomer: vi.fn(),
  patchCustomer: vi.fn(),
  createCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  createCustomerAddress: vi.fn(),
  editCustomerAddress: vi.fn(),
  partiallyEditCustomerAddress: vi.fn(),
  deleteCustomerAddress: vi.fn(),
  getAssistedBuyingLogin: vi.fn(),
}))
const couponsApi = vi.hoisted(() => ({ getReferralCoupon: vi.fn() }))
const iamApi = vi.hoisted(() => ({ getAllGroupsForUser: vi.fn() }))
const segmentsApi = vi.hoisted(() => ({ getAllSegments: vi.fn() }))
const configurationApi = vi.hoisted(() => ({
  getRestrictions: vi.fn(),
  getSyncBetweenRestrictionsAndSiteCodes: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({
  granted: [] as string[],
  userScopes: [] as string[],
}))
const toggles = vi.hoisted(() => ({ valid: [] as string[] }))
const sites = vi.hoisted(() => ({ list: [] as unknown[] }))
const host = vi.hoisted(() => ({ assign: vi.fn() }))
const mixins = vi.hoisted(() => ({
  loadMixins: vi.fn(),
  onEdit: {} as Record<string, MixinsProps['onEdit']>,
  tabs: {} as Record<string, { id: string; label: string; content: unknown }[]>,
}))

vi.mock('../hooks/api/customers', () => ({ useCustomerApi: () => api }))
vi.mock('../hooks/api/coupons', () => ({ useCouponsApi: () => couponsApi }))
vi.mock('../hooks/api/iam', () => ({ useIamApi: () => iamApi }))
vi.mock('../hooks/api/segments', () => ({
  useSegmentsApi: () => segmentsApi,
}))
vi.mock('../hooks/api/configuration', () => ({
  useConfigurationApi: () => configurationApi,
}))
vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    activeCountries: [{ code: 'DE', name: { en: 'Germany' }, active: true }],
    activeCountriesDropdownOptions: [{ label: 'DE - Germany', value: 'DE' }],
  }),
}))
vi.mock('../hooks/useCurrencies', () => ({
  useCurrencies: () => ({
    currenciesDropdownOptions: [
      { label: 'EUR', value: 'EUR' },
      { label: 'USD', value: 'USD' },
    ],
  }),
}))
vi.mock('../context/SitesProvider', () => ({
  useSites: () => ({ sites: sites.list }),
}))
vi.mock('../context/FeatureTogglesProvider', () => ({
  useFeatureToggles: () => ({
    isToggleValid: (code: string) => toggles.valid.includes(code),
  }),
}))
vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: permissions.userScopes,
  }),
}))
vi.mock('../helpers/hostUrls', async () => {
  const actual = await vi.importActual<typeof import('../helpers/hostUrls')>(
    '../helpers/hostUrls'
  )
  return { ...actual, assignHostLocation: host.assign }
})
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})
// The mixins subsystem is copied and tested on its own; the page contract is
// which mixins it loads and what a mixin save sends.
vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: (props: MixinsProps) => {
    mixins.onEdit[props.type] = props.onEdit
    return {
      loadMixins: mixins.loadMixins,
      isMixinsLoading: false,
      mixinsTabs: mixins.tabs[props.type] ?? [],
      mixinsForms: [],
    }
  },
}))
vi.mock('../components/auditLog/EntityChangelogTab', () => ({
  default: ({ entity, entityId }: { entity: string; entityId: string }) => (
    <div data-testid="changelog">{`${entity}:${entityId}`}</div>
  ),
}))

const MANAGER = [
  EmployeeDomains.CUSTOMERS_VIEWER,
  EmployeeDomains.CUSTOMERS_MANAGER,
  EmployeeDomains.AUDIT_LOG_VIEWER,
]

const address = {
  id: 'A1',
  contactName: 'Ann Archer',
  companyName: 'Acme',
  street: 'Main',
  streetNumber: '1',
  streetAppendix: '',
  zipCode: '10115',
  city: 'Berlin',
  country: 'DE',
  isDefault: true,
  tags: ['billing'],
  contactPhone: '',
  state: '',
  mixins: { extra: { note: 'x' } },
  metadata: { mixins: { extra: 'https://schema/extra.json' } },
}

const customer = {
  id: 'C1',
  customerNumber: 'N-100',
  firstName: 'Ann',
  lastName: 'Archer',
  title: 'MS',
  active: true,
  onHold: false,
  contactEmail: 'ann@example.com',
  contactPhone: '123',
  preferredCurrency: 'EUR',
  preferredSite: 'main',
  businessModel: 'B2B',
  restriction: 'main',
  metadataCreatedAt: '2026-01-02T10:00:00Z',
  b2b: {
    companyRegistrationId: null,
    legalEntities: [{ id: 'LE 1', name: 'Acme GmbH' }],
  },
  mixins: {
    marketing: { bonusPoints: 42 },
    customerNewsletter: { signOnDate: '2026-02-01T00:00:00Z' },
    loyalty: { tier: 'gold' },
  },
  metadata: { mixins: { loyalty: 'https://schema/loyalty.json' } },
  addresses: [address],
}

const LocationDisplay = () => {
  const location = useLocation()
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  )
}

const appStateFor = (tenant: string): AppState => ({
  tenant,
  language: 'en',
  token: '',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
})

/** The remote's HashRouter routes (RemoteComponent), starting at `path`. */
const renderPage = (path: string, tenant = 'tnt') => {
  window.location.hash = `#${path}`
  const tree = (currentTenant: string) => (
    <DashboardProvider appState={appStateFor(currentTenant)}>
      <HashRouter>
        <RefreshValuesProvider>
          <Routes>
            <Route path="/" element={<div>list</div>} />
            <Route path="/add" element={<CustomerAddEditPage />} />
            <Route path="/:customerId" element={<CustomerAddEditPage />} />
          </Routes>
          <LocationDisplay />
        </RefreshValuesProvider>
      </HashRouter>
    </DashboardProvider>
  )
  const result = render(tree(tenant))
  return {
    ...result,
    switchTenant: (next: string) => result.rerender(tree(next)),
  }
}

const location = () => screen.getByTestId('location').textContent ?? ''
const input = (id: string) => document.getElementById(id) as HTMLInputElement
const typeInto = (id: string, value: string) =>
  fireEvent.change(input(id), { target: { value } })
const saveButton = () =>
  screen.getByTestId('customer-save') as HTMLButtonElement
const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement
const openTab = (id: string) =>
  fireEvent.click(screen.getByTestId(`customer-tabs-tab-${id}`))
const pickOption = (testId: string, index: number) => {
  // Open the panel unless an earlier check left it open.
  if (!screen.queryByTestId(`${testId}-option-${index}`)) {
    fireEvent.click(screen.getByTestId(`${testId}-control`))
  }
  fireEvent.mouseDown(screen.getByTestId(`${testId}-option-${index}`))
}
const optionLabels = (testId: string) => {
  fireEvent.click(screen.getByTestId(`${testId}-control`))
  return screen
    .queryAllByTestId(new RegExp(`^${testId}-option-\\d+$`))
    .map((option) => option.textContent)
}
const customerLoaded = () =>
  waitFor(() => expect(input('customer-first-name').value).toBe('Ann'))
const lastPayload = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls[mock.mock.calls.length - 1][0]

describe('Customer add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [...MANAGER]
    permissions.userScopes = []
    toggles.valid = []
    sites.list = [
      { code: 'main', name: 'Main', assistedBuying: { storefrontUrl: '' } },
      { code: 'outlet', name: 'Outlet', assistedBuying: { storefrontUrl: '' } },
    ]
    mixins.tabs = {}
    mixins.onEdit = {}
    api.syncCustomer.mockImplementation(async (id: string) => {
      if (id === 'C1') return structuredClone(customer)
      throw { response: { status: 404, data: { message: 'Not found' } } }
    })
    api.createCustomer.mockResolvedValue({ id: 'NEW1', link: '' })
    api.editCustomer.mockResolvedValue({})
    api.patchCustomer.mockResolvedValue({})
    api.deleteCustomer.mockResolvedValue({})
    api.createCustomerAddress.mockResolvedValue({ id: 'A2' })
    api.editCustomerAddress.mockResolvedValue({})
    api.partiallyEditCustomerAddress.mockResolvedValue({})
    api.deleteCustomerAddress.mockResolvedValue({})
    couponsApi.getReferralCoupon.mockResolvedValue({ code: 'REF-1' })
    iamApi.getAllGroupsForUser.mockResolvedValue([
      { id: 'G1', name: { en: 'VIP' } },
    ])
    segmentsApi.getAllSegments.mockResolvedValue([
      { id: 'S1', name: { en: 'Big spenders' } },
    ])
    configurationApi.getRestrictions.mockResolvedValue({
      value: ['main', 'outlet'],
    })
    configurationApi.getSyncBetweenRestrictionsAndSiteCodes.mockResolvedValue({
      value: false,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    window.location.hash = ''
  })

  // Scenario 5
  describe('create', () => {
    it('creates a customer and opens it', async () => {
      renderPage('/add')
      // Addresses only exist on a saved customer.
      expect(
        (screen.getByTestId('customer-tabs-tab-addresses') as HTMLButtonElement)
          .disabled
      ).toBe(true)
      expect(saveButton().disabled).toBe(true)

      typeInto('customer-first-name', 'Cleo')
      typeInto('customer-email', 'cleo@example.com')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() => expect(api.createCustomer).toHaveBeenCalled())
      expect(lastPayload(api.createCustomer)).toMatchObject({
        firstName: 'Cleo',
        contactEmail: 'cleo@example.com',
        // Host currency is the default, as MD's header currency.
        preferredCurrency: 'EUR',
        businessModel: 'B2B',
        title: 'MR',
        restriction: null,
      })
      expect(lastPayload(api.createCustomer).password).toBeUndefined()
      await waitFor(() => expect(location()).toBe('/NEW1'))
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('customers.toasts.successCreate')
      )
    })

    it('requires a contact email', async () => {
      renderPage('/add')
      typeInto('customer-first-name', 'Cleo')

      await waitFor(() => expect(saveButton().disabled).toBe(true))
    })

    it('blocks save for a password shorter than 6 characters', async () => {
      renderPage('/add')
      typeInto('customer-email', 'cleo@example.com')
      typeInto('customer-password', 'abc')
      await waitFor(() => expect(saveButton().disabled).toBe(true))

      typeInto('customer-password', 'abcdef')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(lastPayload(api.createCustomer).password).toBe('abcdef')
      )
    })

    it('masks the password and reveals it with the eye', async () => {
      renderPage('/add')
      typeInto('customer-password', 'secret1')
      expect(input('customer-password').type).toBe('password')

      fireEvent.click(button(i18n.t('customers.details.passwordToggle.show')))
      await waitFor(() => expect(input('customer-password').type).toBe('text'))
      expect(input('customer-password').value).toBe('secret1')

      fireEvent.click(button(i18n.t('customers.details.passwordToggle.hide')))
      await waitFor(() =>
        expect(input('customer-password').type).toBe('password')
      )
    })

    it('autogenerates a 12-character password', async () => {
      renderPage('/add')
      typeInto('customer-email', 'cleo@example.com')
      fireEvent.click(input('customer-autogenerate'))

      await waitFor(() =>
        expect(input('customer-password').value).toHaveLength(12)
      )
      expect(input('customer-password').disabled).toBe(true)
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(lastPayload(api.createCustomer).password).toHaveLength(12)
      )
    })

    it('shows the service message when the create fails', async () => {
      api.createCustomer.mockRejectedValue({
        response: { data: { message: 'email taken' } },
      })
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      renderPage('/add')
      typeInto('customer-email', 'cleo@example.com')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          i18n.t('customers.toasts.errorSave'),
          'email taken'
        )
      )
      expect(location()).toBe('/add')
    })
  })

  // Scenario 6
  describe('edit', () => {
    it('updates the customer, then reloads it', async () => {
      renderPage('/C1')
      await customerLoaded()
      expect(saveButton().disabled).toBe(true)

      typeInto('customer-first-name', 'Anna')
      fireEvent.click(
        within(screen.getByTestId('customer-on-hold')).getByRole('button', {
          name: 'Yes',
        })
      )
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() => expect(api.editCustomer).toHaveBeenCalled())
      expect(lastPayload(api.editCustomer)).toMatchObject({
        id: 'C1',
        firstName: 'Anna',
        onHold: true,
        active: true,
        restriction: 'main',
      })
      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith(
          i18n.t('customers.toasts.successUpdate')
        )
      )
      expect(api.syncCustomer).toHaveBeenCalledTimes(2)
    })

    it('discards unsaved changes', async () => {
      renderPage('/C1')
      await customerLoaded()
      typeInto('customer-first-name', 'Anna')
      await waitFor(() => expect(button('Discard').disabled).toBe(false))

      fireEvent.click(button('Discard'))
      await waitFor(() =>
        expect(input('customer-first-name').value).toBe('Ann')
      )
      expect(api.editCustomer).not.toHaveBeenCalled()
    })

    it('shows the service message when the update fails', async () => {
      api.editCustomer.mockRejectedValue({
        response: { data: { message: 'conflict' } },
      })
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      renderPage('/C1')
      await customerLoaded()
      typeInto('customer-last-name', 'Smith')
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() =>
        expect(toast.showError).toHaveBeenCalledWith(
          i18n.t('customers.toasts.errorSave'),
          'conflict'
        )
      )
    })

    it('shows the id and customer number read-only and hides the password', async () => {
      renderPage('/C1')
      await customerLoaded()

      expect(input('customer-id').value).toBe('C1')
      expect(input('customer-id').disabled).toBe(true)
      expect(input('customer-number').value).toBe('N-100')
      expect(input('customer-password')).toBeNull()
    })

    it('returns to the list when the customer cannot be loaded', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      renderPage('/missing')

      await waitFor(() => expect(location()).toBe('/'))
      expect(toast.showError).toHaveBeenCalled()
    })
  })

  // Scenario 7
  describe('read-only context', () => {
    it('shows marketing information and the referral coupon', async () => {
      renderPage('/C1')
      await customerLoaded()
      const marketing = screen.getByTestId('customer-marketing')

      expect(within(marketing).getByText('42')).toBeTruthy()
      await waitFor(() =>
        expect(within(marketing).getByText('REF-1')).toBeTruthy()
      )
      expect(couponsApi.getReferralCoupon).toHaveBeenCalledWith('C1')
    })

    it('links segments, companies and groups to their screens', async () => {
      renderPage('/C1')
      await customerLoaded()

      const segment = await within(
        screen.getByTestId('customer-segments')
      ).findByRole('link', { name: 'Big spenders' })
      expect(segment.getAttribute('href')).toMatch(
        /^\/customer-management\/segments\/S1\?backTo=/
      )
      expect(segmentsApi.getAllSegments).toHaveBeenCalledWith(
        undefined,
        undefined,
        { customerId: 'C1' }
      )

      const company = within(
        screen.getByTestId('customer-companies')
      ).getByRole('link', { name: 'Acme GmbH' })
      // The company page's Back returns to this customer.
      expect(company.getAttribute('href')).toBe(
        '/apps/management/companies#/LE%201?customerId=C1'
      )
      fireEvent.click(company)
      expect(host.assign).toHaveBeenCalledWith(
        '/apps/management/companies#/LE%201?customerId=C1'
      )

      const group = await within(
        screen.getByTestId('customer-groups')
      ).findByRole('link', { name: 'VIP' })
      expect(group.getAttribute('href')).toBe(
        '/administration/customer-groups#/groups/G1'
      )
    })

    it('says when nothing is assigned', async () => {
      api.syncCustomer.mockResolvedValue({
        ...structuredClone(customer),
        b2b: { legalEntities: [], companyRegistrationId: null },
      })
      segmentsApi.getAllSegments.mockResolvedValue([])
      iamApi.getAllGroupsForUser.mockResolvedValue([])
      renderPage('/C1')
      await customerLoaded()

      expect(
        screen.getByText(i18n.t('customers.details.noCompanies'))
      ).toBeTruthy()
      expect(
        screen.getByText(i18n.t('customers.details.noSegments'))
      ).toBeTruthy()
      expect(
        screen.getByText(i18n.t('customers.details.noGroups'))
      ).toBeTruthy()
    })
  })

  // Scenario 8
  describe('restrictions', () => {
    it('offers every configured restriction to an unrestricted user', async () => {
      renderPage('/add')
      await waitFor(() =>
        expect(optionLabels('customer-restriction')).toEqual(['main', 'outlet'])
      )
      expect(optionLabels('customer-site')).toEqual([
        'Main - main',
        'Outlet - outlet',
      ])
    })

    it('offers a restricted user only their restrictions', async () => {
      permissions.userScopes = ['customer.customer_read--outlet']
      renderPage('/add')

      await waitFor(() =>
        expect(optionLabels('customer-restriction')).toEqual(['outlet'])
      )
      // Without sync every site stays selectable.
      expect(optionLabels('customer-site')).toHaveLength(2)
    })

    it('limits sites and restrictions, requires a site and syncs the restriction', async () => {
      permissions.userScopes = ['customer.customer_manage--outlet']
      configurationApi.getSyncBetweenRestrictionsAndSiteCodes.mockResolvedValue(
        { value: true }
      )
      renderPage('/add')
      await waitFor(() =>
        expect(optionLabels('customer-site')).toEqual(['Outlet - outlet'])
      )
      // The site decides the restriction: the field is locked.
      expect(
        screen
          .getByTestId('customer-restriction-control')
          .getAttribute('aria-disabled')
      ).toBe('true')

      typeInto('customer-email', 'cleo@example.com')
      // The site is required for a restricted user.
      await waitFor(() => expect(saveButton().disabled).toBe(true))
      pickOption('customer-site', 0)
      await waitFor(() => expect(saveButton().disabled).toBe(false))
      fireEvent.click(saveButton())

      await waitFor(() =>
        expect(lastPayload(api.createCustomer)).toMatchObject({
          preferredSite: 'outlet',
          restriction: 'outlet',
        })
      )
    })
  })

  // Scenario 9
  describe('addresses', () => {
    const addressCard = (idx: number) =>
      screen.getByTestId(`customer-address-${idx}`)

    it('saves an edited address on its own', async () => {
      renderPage('/C1')
      await customerLoaded()
      openTab('addresses')
      typeInto('address-0-city', 'Hamburg')
      fireEvent.click(
        within(addressCard(0)).getByRole('button', { name: 'Save' })
      )

      await waitFor(() =>
        expect(api.editCustomerAddress).toHaveBeenCalledWith(
          'C1',
          expect.objectContaining({ id: 'A1', city: 'Hamburg' })
        )
      )
      expect(api.createCustomerAddress).not.toHaveBeenCalled()
      await waitFor(() =>
        expect(toast.showSuccess).toHaveBeenCalledWith(
          i18n.t('customers.toasts.successUpdate')
        )
      )
    })

    it('creates a new address once contact name and country are set', async () => {
      renderPage('/C1')
      await customerLoaded()
      openTab('addresses')
      fireEvent.click(button(i18n.t('customers.addAddress')))
      const save = within(addressCard(1)).getByRole('button', {
        name: 'Save',
      }) as HTMLButtonElement
      expect(save.disabled).toBe(true)

      typeInto('address-1-contactName', 'Bob')
      pickOption('address-1-country', 0)
      await waitFor(() => expect(save.disabled).toBe(false))
      fireEvent.click(save)

      await waitFor(() =>
        expect(api.createCustomerAddress).toHaveBeenCalledWith(
          'C1',
          expect.objectContaining({ contactName: 'Bob', country: 'DE' })
        )
      )
    })

    it('deletes a saved address', async () => {
      renderPage('/C1')
      await customerLoaded()
      openTab('addresses')
      fireEvent.click(
        within(addressCard(0)).getByRole('button', { name: 'Delete' })
      )

      await waitFor(() =>
        expect(api.deleteCustomerAddress).toHaveBeenCalledWith('C1', 'A1')
      )
      await waitFor(() =>
        expect(screen.queryByTestId('customer-address-0')).toBeNull()
      )
    })

    it('drops a new, unsaved address without calling the service', async () => {
      renderPage('/C1')
      await customerLoaded()
      openTab('addresses')
      fireEvent.click(button(i18n.t('customers.addAddress')))
      fireEvent.click(
        within(addressCard(1)).getByRole('button', { name: 'Delete' })
      )

      await waitFor(() =>
        expect(screen.queryByTestId('customer-address-1')).toBeNull()
      )
      expect(api.deleteCustomerAddress).not.toHaveBeenCalled()
    })

    it('saves an address mixin through the address', async () => {
      mixins.tabs.CUSTOMER_ADDRESS = [
        { id: 'extra', label: 'Extra', content: <div>extra form</div> },
      ]
      renderPage('/C1')
      await customerLoaded()
      openTab('addresses')
      // Mixin tabs show for an address with a contact name.
      expect(
        within(addressCard(0)).getByRole('button', { name: 'Extra' })
      ).toBeTruthy()

      await mixins.onEdit.CUSTOMER_ADDRESS(
        { note: 'y' },
        { key: 'extra', url: 'https://schema/extra.json' }
      )

      expect(api.partiallyEditCustomerAddress).toHaveBeenCalledWith('C1', {
        id: 'A1',
        mixins: { extra: { note: 'y' } },
        metadata: { mixins: { extra: 'https://schema/extra.json' } },
      })
    })
  })

  // Scenario 10
  it('saves a customer mixin on the customer', async () => {
    renderPage('/C1')
    await customerLoaded()
    expect(mixins.loadMixins).toHaveBeenCalledWith(
      { loyalty: 'https://schema/loyalty.json' },
      expect.objectContaining({ loyalty: { tier: 'gold' } })
    )

    await mixins.onEdit.CUSTOMER(
      { tier: 'platinum' },
      { key: 'loyalty', url: 'https://schema/loyalty-v2.json' }
    )

    expect(api.patchCustomer).toHaveBeenCalledWith({
      id: 'C1',
      mixins: expect.objectContaining({ loyalty: { tier: 'platinum' } }),
      metadata: { mixins: { loyalty: 'https://schema/loyalty-v2.json' } },
    })
    await waitFor(() =>
      expect(toast.showSuccess).toHaveBeenCalledWith(
        i18n.t('customers.toasts.successUpdate')
      )
    )
  })

  // Scenario 11
  describe('audit log', () => {
    it('shows the customer changelog to an audit log viewer', async () => {
      renderPage('/C1')
      await customerLoaded()
      openTab('audit-log')

      expect(screen.getByTestId('changelog').textContent).toBe('customer:C1')
    })

    it('has no audit log tab without the permission', async () => {
      permissions.granted = [
        EmployeeDomains.CUSTOMERS_VIEWER,
        EmployeeDomains.CUSTOMERS_MANAGER,
      ]
      renderPage('/C1')
      await customerLoaded()

      expect(screen.queryByTestId('customer-tabs-tab-audit-log')).toBeNull()
    })
  })

  // Scenario 12
  describe('assisted buying', () => {
    const enable = () => {
      permissions.userScopes = ['customer.assistedBuying_manage']
      toggles.valid = ['DCP_ASSISTED_BUYING']
      sites.list = [
        {
          code: 'main',
          name: 'Main',
          assistedBuying: { storefrontUrl: 'https://shop.example.com/login' },
        },
        {
          code: 'outlet',
          name: 'Outlet',
          assistedBuying: { storefrontUrl: '' },
        },
      ]
    }

    it('opens the storefront logged in as the customer', async () => {
      enable()
      api.getAssistedBuyingLogin.mockResolvedValue({
        accessToken: 'at',
        expiresIn: 3600,
        refreshToken: 'rt',
        refreshTokenExpiresIn: 7200,
        saasToken: 'st',
      })
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderPage('/C1')
      await customerLoaded()

      const splitButton = screen.getByTestId('assisted-buying')
      fireEvent.click(
        within(splitButton).getByRole('button', {
          name: i18n.t('customers.assistedBuying.button'),
          expanded: false,
        })
      )
      fireEvent.click(await screen.findByText('Main'))

      await waitFor(() => expect(open).toHaveBeenCalled())
      expect(api.getAssistedBuyingLogin).toHaveBeenCalledWith('C1')
      const url = new URL(open.mock.calls[0][0] as string)
      expect(url.origin + url.pathname).toBe('https://shop.example.com/login')
      expect(Object.fromEntries(url.searchParams)).toEqual({
        customerToken: 'at',
        customerTokenExpiresIn: '3600',
        refreshToken: 'rt',
        refreshTokenExpiresIn: '7200',
        saasToken: 'st',
      })
      expect(open.mock.calls[0][1]).toBe('_blank')
      expect(screen.queryByText('Outlet')).toBeNull()
    })

    it('is hidden without the assisted-buying scope', async () => {
      enable()
      permissions.userScopes = []
      renderPage('/C1')
      await customerLoaded()

      expect(screen.queryByTestId('assisted-buying')).toBeNull()
    })

    it('is hidden while the feature toggle is off', async () => {
      enable()
      toggles.valid = []
      renderPage('/C1')
      await customerLoaded()

      expect(screen.queryByTestId('assisted-buying')).toBeNull()
    })
  })

  // Scenario 13
  it('deletes the customer after confirmation and opens the list', async () => {
    renderPage('/C1')
    await customerLoaded()
    fireEvent.click(button('Delete'))
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(i18n.t('customers.actions.deleteMessage'))
    ).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(api.deleteCustomer).toHaveBeenCalledWith('C1'))
    await waitFor(() => expect(location()).toBe('/'))
    expect(toast.showSuccess).toHaveBeenCalledWith(
      i18n.t('customers.toasts.successDelete')
    )
  })

  // Scenario 14
  it('keeps every edit unavailable for a viewer', async () => {
    permissions.granted = [EmployeeDomains.CUSTOMERS_VIEWER]
    renderPage('/C1')
    await customerLoaded()

    expect(button('Delete').disabled).toBe(true)
    expect(button('Discard').disabled).toBe(true)
    expect(saveButton().disabled).toBe(true)
    expect(input('customer-first-name').readOnly).toBe(true)
    expect(input('customer-email').readOnly).toBe(true)
    openTab('addresses')
    expect(button(i18n.t('customers.addAddress')).disabled).toBe(true)
    expect(input('address-0-city').readOnly).toBe(true)
  })

  // Requirement 18
  it('goes back to the list when the host switches the tenant', async () => {
    const { switchTenant } = renderPage('/C1')
    await customerLoaded()
    switchTenant('other')

    await waitFor(() => expect(location()).toBe('/'))
  })
})
