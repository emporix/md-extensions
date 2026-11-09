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
import { NavigationConfirmProvider } from '../context/NavigationConfirmProvider'
import { RefreshValuesProvider } from '../context/RefreshValuesProvider'
import type { AppState } from '../models/AppState.model'
import CompanyAddEditPage from './CompanyAddEdit.page'

const api = vi.hoisted(() => ({
  getLegalEntity: vi.fn(),
  createLegalEntity: vi.fn(),
  updateLegalEntity: vi.fn(),
  getSubsidiaries: vi.fn(),
  deleteLocation: vi.fn(),
}))
const configurationApi = vi.hoisted(() => ({ getRestrictions: vi.fn() }))
const schemaApi = vi.hoisted(() => ({ getSchemas: vi.fn() }))
const toast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}))
const permissions = vi.hoisted(() => ({
  granted: [] as string[],
  userScopes: [] as string[],
}))
const host = vi.hoisted(() => ({ assign: vi.fn() }))
const mixins = vi.hoisted(() => ({ loadMixins: vi.fn() }))

vi.mock('../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => api,
}))
vi.mock('../hooks/api/configuration', () => ({
  useConfigurationApi: () => configurationApi,
}))
vi.mock('../hooks/api/schema', () => ({
  useSchemaApi: () => schemaApi,
}))
vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    activeCountries: [{ code: 'DE', name: { en: 'Germany' }, active: true }],
    activeCountriesDropdownOptions: [{ label: 'DE - Germany', value: 'DE' }],
  }),
}))
vi.mock('../hooks/useCurrencies', () => ({
  useCurrencies: () => ({
    currencies: [{ code: 'EUR', name: { en: 'Euro' } }],
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
// that a loaded company's mixins are handed to it.
vi.mock('../components/mixins/useMixinsForm', () => ({
  MIXINS_LOADING_TAB_ID: 'mixins-loading',
  default: () => ({
    loadMixins: mixins.loadMixins,
    isMixinsLoading: false,
    mixinsTabs: [],
    mixinsForms: [],
  }),
}))
vi.mock('../components/auditLog/EntityChangelogTab', () => ({
  default: ({ entity, entityId }: { entity: string; entityId: string }) => (
    <div data-testid="changelog">{`${entity}:${entityId}`}</div>
  ),
}))
// Owned and tested by their own port; stubbed to keep this page test focused.
vi.mock('../components/companies/LegalEntityActions', () => ({
  LegalEntityActions: ({
    legalEntity,
    managerPermissions = true,
  }: {
    legalEntity: { id: string }
    managerPermissions?: boolean
  }) => (
    <span
      data-testid="legal-entity-actions"
      data-manager={String(managerPermissions)}
    >
      {legalEntity.id}
    </span>
  ),
}))
vi.mock('../components/companies/ApprovalGroup', () => ({
  ApprovalGroup: () => <div data-testid="approval-group" />,
}))
vi.mock('../components/contacts/ContactAssignmentList', () => ({
  ContactAssignmentList: () => <div data-testid="contact-assignment-list" />,
}))

const MANAGER = [
  EmployeeDomains.COMPANIES_VIEWER,
  EmployeeDomains.COMPANIES_MANAGER,
  EmployeeDomains.CUSTOMERS_VIEWER,
  EmployeeDomains.CUSTOMERS_MANAGER,
  EmployeeDomains.AUDIT_LOG_VIEWER,
]

const company = {
  id: 'C1',
  name: 'Acme',
  type: 'COMPANY',
  legalInfo: { legalName: 'Acme GmbH', countryOfRegistration: 'DE' },
  accountLimit: { value: 100, currency: 'EUR' },
  customerGroups: [{ id: 'G1', name: { en: 'VIP' } }],
  entitiesAddresses: [
    {
      id: 'L1',
      name: 'HQ',
      type: 'HEADQUARTER',
      contactDetails: {
        addressLine1: 'Main 1',
        city: 'Berlin',
        countryCode: 'DE',
        tags: ['billing', 'shipping'],
      },
    },
  ],
  contacts: [
    {
      id: 'A1',
      type: 'PRIMARY',
      primary: true,
      legalEntity: { id: 'C1' },
      customer: {
        name: 'Ann',
        surname: 'Lee',
        email: 'ann@x.io',
        type: 'CONTACT',
      },
    },
  ],
  mixins: { loyalty: { tier: 'gold' } },
  metadata: { mixins: { loyalty: 'https://schema/loyalty.json' } },
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
        <NavigationConfirmProvider>
          <RefreshValuesProvider>
            <Routes>
              <Route path="/" element={<div>list</div>} />
              <Route path="/add" element={<CompanyAddEditPage />} />
              <Route path="/:companyId" element={<CompanyAddEditPage />} />
              <Route path="*" element={<div>other route</div>} />
            </Routes>
            <LocationDisplay />
          </RefreshValuesProvider>
        </NavigationConfirmProvider>
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
const locationPath = () => location().split('?')[0]
const locationQuery = () => new URLSearchParams(location().split('?')[1] ?? '')
const button = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement
const isDisabled = (element: Element) => (element as HTMLButtonElement).disabled
const input = (id: string) => document.getElementById(id) as HTMLInputElement
const typeInto = (id: string, value: string) =>
  fireEvent.change(input(id), { target: { value } })
const openTab = (id: string) => {
  const tab = screen.getByTestId(`company-tabs-tab-${id}`)
  fireEvent.click(tab)
}
const companyLoaded = () =>
  waitFor(() => expect(input('company-name').value).toBe('Acme'))

describe('Company add / edit', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [...MANAGER]
    permissions.userScopes = []
    api.getLegalEntity.mockImplementation(async (id: string) => {
      if (id === 'C1') return structuredClone(company)
      if (id === 'P1') return { id: 'P1', name: 'Parent Co' }
      throw { response: { status: 404, data: { message: 'Not found' } } }
    })
    api.createLegalEntity.mockResolvedValue({ data: { id: 'NEW1' } })
    api.updateLegalEntity.mockResolvedValue({ data: {} })
    api.getSubsidiaries.mockResolvedValue({ values: [] })
    api.deleteLocation.mockResolvedValue({})
    configurationApi.getRestrictions.mockResolvedValue({ value: [] })
    schemaApi.getSchemas.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.location.hash = ''
  })

  // S4
  it('creates a company and opens it', async () => {
    renderPage('/add')

    // Only the details tab is usable before the company exists.
    expect(
      isDisabled(screen.getByTestId('company-tabs-tab-subsidiaries'))
    ).toBe(true)
    expect(isDisabled(button('Save'))).toBe(true)

    typeInto('company-name', 'New Co')
    typeInto('company-id', 'NEW1')
    fireEvent.click(button('Save'))

    await waitFor(() =>
      expect(api.createLegalEntity).toHaveBeenCalledWith({
        name: 'New Co',
        id: 'NEW1',
        restrictions: undefined,
      })
    )
    expect(toast.showSuccess).toHaveBeenCalledWith('Created company!')
    await waitFor(() => expect(location()).toBe('/NEW1'))
  })

  // S4
  it('pre-fills a new subsidiary from the parent company', async () => {
    renderPage('/add?parentCompany=P1')

    await screen.findByRole('heading', { name: 'Subsidiary' })
    typeInto('company-name', 'Child Co')
    fireEvent.click(button('Save'))

    await waitFor(() =>
      expect(api.createLegalEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Child Co',
          parentId: 'P1',
          type: 'SUBSIDIARY',
        })
      )
    )
  })

  // S4
  it('shows the save error and stays on the create form', async () => {
    api.createLegalEntity.mockRejectedValue({
      response: { data: { details: 'Id taken' } },
    })
    renderPage('/add')

    typeInto('company-name', 'New Co')
    fireEvent.click(button('Save'))

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Failed to save company',
        'Id taken'
      )
    )
    expect(location()).toBe('/add')
  })

  // S5
  it('saves an edited company and reloads it', async () => {
    renderPage('/C1')
    await companyLoaded()
    expect(mixins.loadMixins).toHaveBeenCalledWith(
      company.metadata.mixins,
      company.mixins
    )
    // An existing company's id is shown greyed out and cannot be changed.
    expect(input('company-id').disabled).toBe(true)
    expect(isDisabled(button('Save'))).toBe(true)

    typeInto('company-name', 'Acme 2')
    openTab('policies')
    typeInto('company-account-limit', '250')
    fireEvent.click(button('Save'))

    await waitFor(() =>
      expect(api.updateLegalEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'C1',
          name: 'Acme 2',
          accountLimit: { value: '250', currency: 'EUR' },
        })
      )
    )
    expect(toast.showSuccess).toHaveBeenCalledWith('Updated company!')
    await waitFor(() =>
      expect(
        api.getLegalEntity.mock.calls.filter(([id]) => id === 'C1').length
      ).toBeGreaterThanOrEqual(3)
    )
  })

  // S5
  it('discards unsaved changes', async () => {
    renderPage('/C1')
    await companyLoaded()

    typeInto('company-name', 'Changed')
    expect(isDisabled(button('Discard'))).toBe(false)
    fireEvent.click(button('Discard'))

    await waitFor(() => expect(input('company-name').value).toBe('Acme'))
    expect(isDisabled(button('Save'))).toBe(true)
    expect(api.updateLegalEntity).not.toHaveBeenCalled()
  })

  // S6
  it('returns to the list with an error when the company does not exist', async () => {
    renderPage('/missing')

    await waitFor(() => expect(location()).toBe('/'))
    expect(toast.showError).toHaveBeenCalledWith(
      'Failed to load company',
      'Not found'
    )
  })

  // S6
  it('returns to the list when the host switches tenant', async () => {
    const { switchTenant } = renderPage('/C1', 'tenant-a')
    await companyLoaded()

    switchTenant('tenant-b')

    await waitFor(() => expect(location()).toBe('/'))
  })

  // S8
  it('goes back to the list, or to the customer it was opened from', async () => {
    renderPage('/C1')
    await companyLoaded()
    fireEvent.click(screen.getByTestId('back-button'))
    await waitFor(() => expect(location()).toBe('/'))
    cleanup()

    renderPage('/C1?customerId=CU1')
    await companyLoaded()
    fireEvent.click(screen.getByTestId('back-button'))
    expect(host.assign).toHaveBeenCalledWith('/apps/management/customers/CU1')
  })

  // S8
  it('goes back from a new subsidiary to its parent', async () => {
    renderPage('/add?parentCompany=P1')
    await screen.findByRole('heading', { name: 'Subsidiary' })

    fireEvent.click(screen.getByTestId('back-button'))

    await waitFor(() => expect(location()).toBe('/P1'))
  })

  // S8
  it('shows the parent chain as a breadcrumb', async () => {
    api.getLegalEntity.mockImplementation(async (id: string) => {
      if (id === 'C1') return { ...structuredClone(company), parentId: 'P1' }
      if (id === 'P1') return { id: 'P1', name: 'Parent Co' }
      throw new Error('unexpected')
    })
    renderPage('/C1')

    const breadcrumb = await screen.findByTestId('company-breadcrumb')
    await waitFor(() => expect(breadcrumb.textContent).toBe('Parent Co/Acme'))
    fireEvent.click(
      within(breadcrumb).getByRole('button', { name: 'Parent Co' })
    )
    await waitFor(() => expect(location()).toBe('/P1'))
  })

  // S8
  it('loads subsidiaries once, not on every edit of the company form', async () => {
    renderPage('/C1')
    await companyLoaded()
    await waitFor(() => expect(api.getSubsidiaries).toHaveBeenCalledTimes(1))

    typeInto('company-name', 'Acme renamed')
    typeInto('company-legal-name', 'Acme renamed GmbH')

    expect(api.getSubsidiaries).toHaveBeenCalledTimes(1)
  })

  // S8
  it('lists subsidiaries and adds a new one under this company', async () => {
    api.getSubsidiaries.mockResolvedValue({
      values: [
        {
          id: 'S1',
          name: 'Sub Co',
          legalInfo: { countryOfRegistration: 'DE' },
          contacts: [
            { primary: true, customer: { name: 'Bo', surname: 'Ng' } },
          ],
        },
      ],
    })
    renderPage('/C1')
    await companyLoaded()
    openTab('subsidiaries')

    const table = await screen.findByTestId('subsidiaries-table')
    await within(table).findByText('Sub Co')
    expect(api.getSubsidiaries).toHaveBeenCalledWith('C1', true)
    expect(within(table).getByText('Bo Ng')).toBeTruthy()
    expect(within(table).getByTestId('legal-entity-actions').textContent).toBe(
      'S1'
    )

    fireEvent.click(button('Add new subsidiary'))
    await waitFor(() => expect(locationPath()).toBe('/add'))
    expect(locationQuery().get('parentCompany')).toBe('C1')
  })

  // S9
  it('shows location cards and opens a location mixin', async () => {
    schemaApi.getSchemas.mockResolvedValue([
      { id: 'geo', name: { en: 'Geolocation' }, attributes: [] },
    ])
    renderPage('/C1')
    await companyLoaded()
    openTab('locations')

    const row = await screen.findByTestId('location-row')
    expect(within(row).getByText('HQ')).toBeTruthy()
    expect(within(row).getByText('Main 1, Berlin, DE')).toBeTruthy()
    expect(within(row).getByText('billing')).toBeTruthy()
    expect(schemaApi.getSchemas).toHaveBeenCalledWith('LOCATION')

    fireEvent.click(
      await within(row).findByRole('button', {
        name: 'Open Geolocation mixin',
      })
    )
    await waitFor(() => expect(locationPath()).toBe('/C1/locations/L1'))
    expect(locationQuery().get('mixin')).toBe('geo')
    expect(locationQuery().get('backTo')).toBe(
      '/C1?tab=locations&page=1&rows=10'
    )
  })

  // S9
  it('adds a location', async () => {
    renderPage('/C1')
    await companyLoaded()
    openTab('locations')

    fireEvent.click(button('Add new location'))

    await waitFor(() => expect(location()).toBe('/C1/locations'))
  })

  // S9
  it('deletes a location after confirming', async () => {
    renderPage('/C1')
    await companyLoaded()
    openTab('locations')

    const row = await screen.findByTestId('location-row')
    fireEvent.click(within(row).getByTestId('delete-button'))
    // TableActions' own confirm, then the Locations confirm (MD parity).
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
    const confirm = await screen.findByTestId('location-delete-confirm')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Yes' }))

    await waitFor(() => expect(api.deleteLocation).toHaveBeenCalledWith('L1'))
    await waitFor(() => expect(screen.queryByTestId('location-row')).toBeNull())
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Successfully deleted location'
    )
  })

  // S12 / S15
  it('opens contact and customer assignment forms for this company', async () => {
    renderPage('/C1')
    await companyLoaded()

    expect(screen.getByTestId('primary-contact').textContent).toContain(
      'Ann Lee'
    )
    fireEvent.click(button('Add contact'))
    await waitFor(() =>
      expect(location()).toBe('/C1/assignments/contact?primary=true')
    )
  })

  // S12 / S15
  it('assigns a customer and returns to the customers tab', async () => {
    renderPage('/C1')
    await companyLoaded()
    openTab('customers')
    expect(screen.getByTestId('contact-assignment-list')).toBeTruthy()

    fireEvent.click(button('Assign Customer'))

    await waitFor(() => expect(locationPath()).toBe('/C1/assignments/customer'))
    expect(locationQuery().get('backTo')).toBe(
      '/C1?tab=customers&page=1&rows=10'
    )
  })

  // S12
  it('edits a primary contact through its contact assignment', async () => {
    renderPage('/C1')
    await companyLoaded()

    fireEvent.click(
      within(screen.getByTestId('primary-contact')).getByRole('button', {
        name: 'Edit',
      })
    )

    await waitFor(() => expect(location()).toBe('/C1/assignments/contact/A1'))
  })

  // S16
  it('opens a customer group in the host', async () => {
    renderPage('/C1')
    await companyLoaded()
    openTab('client-groups')

    const table = await screen.findByTestId('customer-groups-table')
    expect(within(table).getByText('VIP')).toBeTruthy()
    fireEvent.click(within(table).getByTestId('edit-button'))

    expect(host.assign).toHaveBeenCalledWith(
      '/administration/customer-groups#/groups/G1'
    )
  })

  // Audit log
  it('shows the audit log tab only to audit log viewers', async () => {
    renderPage('/C1')
    await companyLoaded()
    expect(screen.getByTestId('changelog').textContent).toBe('company:C1')
    cleanup()

    permissions.granted = MANAGER.filter(
      (d) => d !== EmployeeDomains.AUDIT_LOG_VIEWER
    )
    renderPage('/C1')
    await companyLoaded()
    expect(screen.queryByTestId('company-tabs-tab-audit-log')).toBeNull()
  })

  // S3
  it('keeps the company read-only without the companies manager role', async () => {
    permissions.granted = [EmployeeDomains.COMPANIES_VIEWER]
    api.getSubsidiaries.mockResolvedValue({
      values: [{ id: 'S1', name: 'Sub Co', legalInfo: {}, contacts: [] }],
    })
    renderPage('/C1')
    await companyLoaded()

    expect(input('company-name').readOnly).toBe(true)
    expect(input('company-legal-name').readOnly).toBe(true)
    expect(isDisabled(button('Add contact'))).toBe(true)
    typeInto('company-name', 'Changed')
    expect(isDisabled(button('Save'))).toBe(true)

    openTab('locations')
    expect(isDisabled(button('Add new location'))).toBe(true)
    const locationRow = await screen.findByTestId('location-row')
    expect(
      within(locationRow).getByTestId('delete-button').closest('button')
        ?.disabled
    ).toBe(true)
    openTab('subsidiaries')
    expect(isDisabled(button('Add new subsidiary'))).toBe(true)
    expect(
      (await screen.findByTestId('legal-entity-actions')).dataset.manager
    ).toBe('false')
    openTab('customers')
    expect(isDisabled(button('Assign Customer'))).toBe(true)
    expect(isDisabled(button('Add new contact'))).toBe(true)
  })

  // Restrictions
  it('preselects the only restriction a restricted user may assign', async () => {
    permissions.userScopes = ['customermanagement.legalentity_manage--SITE_A']
    configurationApi.getRestrictions.mockResolvedValue({
      value: ['SITE_A', 'SITE_B'],
    })
    renderPage('/add')
    await waitFor(() =>
      expect(screen.getByTestId('company-restriction').textContent).toContain(
        'SITE_A'
      )
    )
    typeInto('company-name', 'New Co')

    fireEvent.click(button('Save'))

    await waitFor(() =>
      expect(api.createLegalEntity).toHaveBeenCalledWith(
        expect.objectContaining({ restrictions: ['SITE_A'] })
      )
    )
  })
})
