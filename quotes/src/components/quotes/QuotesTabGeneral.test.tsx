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
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import { QuoteDataProvider } from '../../context/Quote.provider'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import QuotesTabGeneral from './QuotesTabGeneral'

const quotesApi = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  createQuote: vi.fn(),
  updateQuote: vi.fn(),
}))
const companiesApi = vi.hoisted(() => ({
  getLegalEntity: vi.fn(),
  getLegalEntities: vi.fn(),
  getAllLegalEntities: vi.fn(),
}))
const customersApi = vi.hoisted(() => ({
  syncCustomer: vi.fn(),
  syncCustomers: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))
const sites = vi.hoisted(() => ({
  value: {
    sites: [{ code: 'main', currency: 'EUR' }],
    currentSite: { code: 'main', currency: 'EUR' },
    updateCurrentSite: () => {},
  },
}))

vi.mock('../../hooks/api/quotes', () => ({ useQuotesApi: () => quotesApi }))
vi.mock('../../hooks/api/customerManagement', () => ({
  useCustomerManagementApi: () => companiesApi,
}))
vi.mock('../../hooks/api/customers', () => ({
  useCustomerApi: () => customersApi,
}))
vi.mock('../../hooks/api/configuration', () => ({
  useConfigurationApi: () => ({
    getRestrictions: async () => ({ value: ['main'] }),
    getSyncBetweenRestrictionsAndSiteCodes: async () => ({ value: false }),
  }),
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: [],
  }),
}))
vi.mock('../../context/SitesProvider', () => ({ useSites: () => sites.value }))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

const company = (locations: unknown[]) => ({
  id: 'LE1',
  name: 'Acme',
  entitiesAddresses: locations,
  contacts: [
    {
      id: 'A1',
      customer: { id: 'CU9', name: 'Ann', surname: 'Lee', email: 'a@x.io' },
    },
  ],
})

const b2bQuote = {
  id: 'Q1',
  businessModel: 'B2B',
  legalEntityId: 'LE1',
  cartId: 'C1',
  customer: { customerId: 'CU9' },
  status: { value: 'OPEN' },
  items: [],
  metadata: { mixins: {} },
}

const appState: AppState = {
  tenant: 'tenant-a',
  language: 'en',
  token: 'token',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  onError: () => {
    // NOOP
  },
}

/** The General tab of `#/{id}` inside the quote provider, as the route has it. */
const renderGeneral = (quoteId = 'Q1') =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={[`/${quoteId}`]}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                <QuotesTabGeneral />
              </QuoteDataProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )

describe('QuotesTabGeneral', () => {
  const originalLocation = window.location
  const assign = vi.fn()

  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [
      EmployeeDomains.QUOTES_MANAGER,
      EmployeeDomains.COMPANIES_VIEWER,
    ]
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    })
    companiesApi.getLegalEntities.mockResolvedValue({
      values: [],
      totalRecords: 0,
    })
    companiesApi.getAllLegalEntities.mockImplementation(async () => [
      company([]),
    ])
  })

  afterEach(() => {
    cleanup()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    vi.clearAllMocks()
  })

  describe('Scenario 16 — links out of the remote', () => {
    it('opens the cart of the quote in the host, without `backTo`', async () => {
      quotesApi.getQuoteById.mockResolvedValue(b2bQuote)
      companiesApi.getLegalEntity.mockResolvedValue(company([]))
      renderGeneral()

      fireEvent.click(await screen.findByRole('button', { name: 'C1' }))

      expect(assign).toHaveBeenCalledWith('/apps/management/carts/C1')
    })

    it("opens the company's locations in the companies remote", async () => {
      quotesApi.getQuoteById.mockResolvedValue(b2bQuote)
      companiesApi.getLegalEntity.mockResolvedValue(company([]))
      renderGeneral()

      expect(
        await screen.findByText('No shipping location for the selected company')
      ).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Add new location' }))

      expect(assign).toHaveBeenCalledWith('/apps/management/companies#/LE1')
    })

    it("opens the B2C customer's addresses in the host", async () => {
      quotesApi.getQuoteById.mockResolvedValue({
        ...b2bQuote,
        businessModel: 'B2C',
        legalEntityId: undefined,
        cartId: undefined,
        customer: { customerId: 'CU1', firstName: 'Elle', lastName: 'J' },
      })
      customersApi.syncCustomer.mockResolvedValue({
        id: 'CU1',
        firstName: 'Elle',
        lastName: 'J',
        contactEmail: 'e@x.io',
        addresses: [],
      })
      renderGeneral()

      // The synced customer is the last update of the form.
      await waitFor(() =>
        expect(
          (screen.getByTestId('quote-customer-name-input') as HTMLInputElement)
            .value
        ).toBe('Elle J')
      )
      fireEvent.click(screen.getByRole('button', { name: 'Add new address' }))

      expect(assign).toHaveBeenCalledWith('/apps/management/customers#/CU1')
    })

    it('opens the order of an accepted quote in the orders remote', async () => {
      quotesApi.getQuoteById.mockResolvedValue({
        ...b2bQuote,
        orderId: 'EON4365',
        status: { value: 'ACCEPTED' },
      })
      companiesApi.getLegalEntity.mockResolvedValue(company([]))
      renderGeneral()

      fireEvent.click(await screen.findByText('EON4365'))

      expect(assign).toHaveBeenCalledWith('/apps/management/orders#/EON4365')
    })
  })

  it('shows the company, its contact and the shipping locations of a B2B quote', async () => {
    quotesApi.getQuoteById.mockResolvedValue({
      ...b2bQuote,
      shippingAddress: { id: 'L1' },
      billingAddress: { id: 'L1' },
    })
    companiesApi.getLegalEntity.mockResolvedValue(
      company([
        {
          id: 'L1',
          name: 'HQ',
          contactDetails: {
            addressLine1: 'Main 1',
            city: 'Berlin',
            countryCode: 'DE',
            tags: ['shipping', 'billing'],
          },
        },
      ])
    )
    renderGeneral()

    expect(await screen.findByText('Ann Lee')).toBeTruthy()
    expect(screen.getByText('a@x.io')).toBeTruthy()
    expect(screen.getByText('HQ')).toBeTruthy()
    expect(screen.getByText('Main 1, Berlin, DE')).toBeTruthy()
    expect(
      (screen.getByTestId('shippingAddressId-L1-input') as HTMLInputElement)
        .checked
    ).toBe(true)
    // Nothing changed yet.
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  // COP-7116: MD enabled Save without an address; the Quote Service needs a
  // shipping and a billing address.
  it('keeps Save disabled for a B2C customer without an address', async () => {
    quotesApi.getQuoteById.mockResolvedValue({
      ...b2bQuote,
      businessModel: 'B2C',
      legalEntityId: undefined,
      customer: { customerId: 'CU1', firstName: 'Elle', lastName: 'J' },
    })
    customersApi.syncCustomer.mockResolvedValue({
      id: 'CU1',
      firstName: 'Elle',
      lastName: 'J',
      contactEmail: 'e@x.io',
      addresses: [],
    })
    renderGeneral()

    await screen.findByRole('button', { name: 'Add new address' })
    // The synced customer makes the form dirty.
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Discard' }) as HTMLButtonElement)
          .disabled
      ).toBe(false)
    )
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  // COP-7116: MD showed the label "Address" untranslated.
  it('labels the location addresses in the user language', async () => {
    await i18n.changeLanguage('de')
    quotesApi.getQuoteById.mockResolvedValue({
      ...b2bQuote,
      shippingAddress: { id: 'L1' },
      billingAddress: { id: 'L1' },
    })
    companiesApi.getLegalEntity.mockResolvedValue(
      company([
        {
          id: 'L1',
          name: 'HQ',
          contactDetails: {
            addressLine1: 'Main 1',
            city: 'Berlin',
            countryCode: 'DE',
            tags: ['shipping', 'billing'],
          },
        },
      ])
    )
    renderGeneral()

    expect(await screen.findByText('HQ')).toBeTruthy()
    expect(screen.getByText('Adresse')).toBeTruthy()
    expect(screen.queryByText('Address')).toBeNull()
  })
})
