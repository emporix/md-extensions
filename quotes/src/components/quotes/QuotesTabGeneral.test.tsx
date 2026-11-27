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
import { useForm } from 'react-hook-form'
import type { QuoteGeneralForm } from '../../helpers/quoteGeneralForm.helpers'
import type { Location } from '../../models/LegalEntity.model'
import { unpricedQuote } from '../../test/quoteNullFixtures'
import QuotesTabGeneral from './QuotesTabGeneral'
import QuotesTabGeneralAddresses from './QuotesTabGeneralAddresses'

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
/** Lets a test pick company LE1 with one click instead of the selector. */
const companyPicker = vi.hoisted(() => ({ fake: false }))
vi.mock('../shared/CompaniesSelector', async (importOriginal) => {
  const { createElement } = await import('react')
  const actual =
    await importOriginal<typeof import('../shared/CompaniesSelector')>()
  const Selector = actual.default
  return {
    default: (props: Parameters<typeof Selector>[0]) =>
      companyPicker.fake
        ? createElement(
            'button',
            { type: 'button', onClick: () => props.onChange('LE1') },
            'pick company'
          )
        : createElement(Selector, props),
  }
})
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

/** A company with two locations for shipping and billing. */
const hqAndWarehouse = () =>
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
    {
      id: 'L2',
      name: 'Warehouse',
      contactDetails: {
        addressLine1: 'Dock 2',
        city: 'Hamburg',
        countryCode: 'DE',
        tags: ['shipping', 'billing'],
      },
    },
  ])

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

      // COP-7125: a company without any location gets the new hint.
      expect(
        await screen.findByText(
          'No locations yet - add them before the customer can accept the quote'
        )
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

      // The label of the customer name is tied to its field.
      expect(
        await screen.findByLabelText(/customer/i, { selector: 'input' })
      ).toBe(screen.getByTestId('quote-customer-name-input'))

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

    // The order link of an accepted quote is in the status box above the
    // tabs since COP-7116 QA: see `QuotesTabGeneralStatus.test.tsx`.
  })

  // COP-7116 (found on dev): a B2C address never showed its contact name (MD
  // set it only in `contactDetails`), and an address without a name left a
  // blank line.
  it('shows the contact name of a B2C address, and "--" for one without', async () => {
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
      addresses: [
        {
          id: 'AD1',
          contactName: 'Elle Jones',
          street: 'Main',
          streetNumber: '1',
          city: 'Berlin',
          country: 'DE',
          tags: ['shipping'],
        },
        {
          id: 'AD2',
          contactName: ' ',
          street: 'Side',
          streetNumber: '2',
          city: 'Hamburg',
          country: 'DE',
          tags: ['shipping'],
        },
      ],
    })
    renderGeneral()
    const card = (id: string) =>
      document.querySelector(`label[for="shippingAddressId${id}"]`)
        ?.textContent ?? ''

    await waitFor(() => expect(card('AD1')).toContain('Elle Jones'))
    expect(card('AD2').startsWith('--')).toBe(true)
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
    // The locations load separately from the customer.
    expect(await screen.findByText('HQ')).toBeTruthy()
    expect(await screen.findByText('Main 1, Berlin, DE')).toBeTruthy()
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

  // COP-7116: Save needs both addresses; with "Same as shipping" the billing
  // address follows the picked shipping address, so Save turns on.
  it('enables Save once a shipping address is picked and billing follows it', async () => {
    quotesApi.getQuoteById.mockResolvedValue({
      ...b2bQuote,
      shippingAddress: { id: 'L1' },
      billingAddress: { id: 'L1' },
    })
    companiesApi.getLegalEntity.mockResolvedValue(hqAndWarehouse())
    renderGeneral()

    fireEvent.click(await screen.findByTestId('shippingAddressId-L2-input'))

    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
          .disabled
      ).toBe(false)
    )
  })

  // COP-7116 QA (Maryna): the toast showed only the generic message of the API.
  it('shows the cause from the API when the update fails', async () => {
    quotesApi.getQuoteById.mockResolvedValue({
      ...b2bQuote,
      shippingAddress: { id: 'L1' },
      billingAddress: { id: 'L1' },
    })
    companiesApi.getLegalEntity.mockResolvedValue(hqAndWarehouse())
    quotesApi.updateQuote.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'There is a validation error. Please check the details.',
          details: [
            {
              field: 'shippingAddress',
              message: 'shippingAddress: must not be null',
            },
          ],
        },
      },
    })
    renderGeneral()

    fireEvent.click(await screen.findByTestId('shippingAddressId-L2-input'))
    const saveButton = screen.getByRole('button', {
      name: 'Save',
    }) as HTMLButtonElement
    await waitFor(() => expect(saveButton.disabled).toBe(false))
    fireEvent.click(saveButton)

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while updating quote',
        'shippingAddress: must not be null'
      )
    )
  })

  // COP-7116 (Copilot on #158): MD enabled Save on create before a site was
  // selected, so a draft could go out without `siteCode`.
  it('keeps Save disabled on create until a site is selected', async () => {
    const withSite = sites.value
    sites.value = { ...withSite, currentSite: undefined as never }
    customersApi.syncCustomers.mockResolvedValue({
      values: [
        { id: 'CU1', firstName: 'Elle', lastName: 'J', contactEmail: 'e@x.io' },
      ],
      totalRecords: 1,
    })
    customersApi.syncCustomer.mockResolvedValue({
      id: 'CU1',
      firstName: 'Elle',
      lastName: 'J',
      contactEmail: 'e@x.io',
      addresses: [
        {
          id: 'AD1',
          street: 'Main',
          streetNumber: '1',
          city: 'Berlin',
          country: 'DE',
          tags: ['shipping', 'billing'],
        },
      ],
    })
    const tree = () => (
      <DashboardProvider appState={appState}>
        <MemoryRouter initialEntries={['/add']}>
          <Routes>
            <Route
              path="/add"
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
    const { rerender } = render(tree())
    const save = () =>
      screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement

    try {
      fireEvent.click(screen.getByLabelText('B2C'))
      fireEvent.click(
        await screen.findByRole('button', { name: 'Choose Customer' })
      )
      fireEvent.click(await screen.findByText('Elle'))
      fireEvent.click(screen.getByRole('button', { name: 'Add Customer' }))
      fireEvent.click(await screen.findByTestId('shippingAddressId-AD1-input'))

      // Customer and addresses are set, but no site yet.
      await waitFor(() =>
        expect(
          (screen.getByRole('button', { name: 'Discard' }) as HTMLButtonElement)
            .disabled
        ).toBe(false)
      )
      expect(save().disabled).toBe(true)

      // The site arrives.
      sites.value = withSite
      rerender(tree())
      await waitFor(() => expect(save().disabled).toBe(false))
    } finally {
      sites.value = withSite
    }
  })

  // COP-7125 (ported from MD quotesNullSafe.test.tsx, emporix/
  // management-dashboard#1707): a company without locations.
  describe('company without locations', () => {
    const twoContacts = (locations: unknown[]) => ({
      ...company(locations),
      contacts: [
        ...company([]).contacts,
        {
          id: 'A2',
          customer: { id: 'CU8', name: 'Bob', surname: 'Ray', email: 'b@x.io' },
        },
      ],
    })

    it('saves without addresses and sends no address operation', async () => {
      quotesApi.getQuoteById.mockResolvedValue(b2bQuote)
      quotesApi.updateQuote.mockResolvedValue({})
      companiesApi.getLegalEntity.mockResolvedValue(twoContacts([]))
      renderGeneral()
      await screen.findByText(
        'No locations yet - add them before the customer can accept the quote'
      )

      fireEvent.click(screen.getByTestId('quote-contact-person-control'))
      fireEvent.mouseDown(
        await screen.findByRole('option', { name: 'Bob Ray' })
      )
      const save = screen.getByRole('button', {
        name: 'Save',
      }) as HTMLButtonElement
      await waitFor(() => expect(save.disabled).toBe(false))
      fireEvent.click(save)

      await waitFor(() =>
        expect(quotesApi.updateQuote).toHaveBeenCalledWith('Q1', [
          { op: 'REPLACE', path: '/customerId', value: 'CU8' },
        ])
      )
    })

    it('keeps the old hint and the address rule for locations without a shipping tag', async () => {
      quotesApi.getQuoteById.mockResolvedValue(b2bQuote)
      companiesApi.getLegalEntity.mockResolvedValue(
        twoContacts([
          {
            id: 'L9',
            name: 'Office',
            contactDetails: { addressLine1: 'Side 9', tags: ['billing'] },
          },
        ])
      )
      renderGeneral()

      expect(
        await screen.findByText('No shipping location for the selected company')
      ).toBeTruthy()
      fireEvent.click(screen.getByTestId('quote-contact-person-control'))
      fireEvent.mouseDown(
        await screen.findByRole('option', { name: 'Bob Ray' })
      )
      await waitFor(() =>
        expect(
          (
            screen.getByRole('button', {
              name: 'Discard',
            }) as HTMLButtonElement
          ).disabled
        ).toBe(false)
      )
      expect(
        (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
          .disabled
      ).toBe(true)
    })

    it('does not tick "Same as shipping" for a quote without addresses', async () => {
      quotesApi.getQuoteById.mockResolvedValue(b2bQuote)
      companiesApi.getLegalEntity.mockResolvedValue(
        company([
          {
            id: 'L1',
            name: 'HQ',
            contactDetails: {
              addressLine1: 'Main 1',
              tags: ['shipping', 'billing'],
            },
          },
        ])
      )
      renderGeneral()

      // Unticked, so the billing list shows next to the shipping list.
      expect(await screen.findAllByText('HQ')).toHaveLength(2)
      expect(
        (document.getElementById('sameAddresses') as HTMLInputElement).checked
      ).toBe(false)
    })

    // The other General cases of MD quotesNullSafe.test.tsx (emporix/
    // management-dashboard#1707), with MD's titles.
    it('general tab', async () => {
      quotesApi.getQuoteById.mockResolvedValue(unpricedQuote())
      companiesApi.getLegalEntity.mockResolvedValue({
        ...company([]),
        id: 'le1',
        name: 'ACME',
      })
      const { container } = renderGeneral()

      await screen.findByText(
        'No locations yet - add them before the customer can accept the quote'
      )
      expect(container.textContent).not.toMatch(/NaN|undefined|null/)
    })

    it('address list tolerates a location without contact details', () => {
      const Host = () => {
        const { control } = useForm<QuoteGeneralForm>()
        return (
          <QuotesTabGeneralAddresses
            addresses={[{ id: 'a1', name: 'HQ' } as Location]}
            control={control}
            name="shippingAddressId"
          />
        )
      }
      const { container } = render(<Host />)

      expect(screen.getByText('HQ')).toBeTruthy()
      expect(container.textContent).not.toMatch(/NaN|undefined|null/)
    })

    it('creating a quote for a company without locations omits the address ids', async () => {
      companyPicker.fake = true
      quotesApi.createQuote.mockResolvedValue('new-id')
      companiesApi.getLegalEntity.mockResolvedValue(company([]))
      try {
        render(
          <DashboardProvider appState={appState}>
            <MemoryRouter initialEntries={['/add']}>
              <Routes>
                <Route
                  path="/add"
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

        fireEvent.click(
          await screen.findByRole('button', { name: 'pick company' })
        )
        expect(
          await screen.findByText(
            'No locations yet - add them before the customer can accept the quote'
          )
        ).toBeTruthy()
        fireEvent.click(screen.getByTestId('quote-contact-person-control'))
        fireEvent.mouseDown(
          await screen.findByRole('option', { name: 'Ann Lee' })
        )
        const save = screen.getByRole('button', {
          name: 'Save',
        }) as HTMLButtonElement
        await waitFor(() => expect(save.disabled).toBe(false))
        fireEvent.click(save)

        await waitFor(() =>
          expect(quotesApi.createQuote).toHaveBeenCalledTimes(1)
        )
        const [request] = quotesApi.createQuote.mock.calls[0]
        expect(request.legalEntityId).toBe('LE1')
        expect(request.customerId).toBe('CU9')
        expect('shippingAddressId' in request).toBe(false)
        expect('billingAddressId' in request).toBe(false)
      } finally {
        companyPicker.fake = false
      }
    })
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
