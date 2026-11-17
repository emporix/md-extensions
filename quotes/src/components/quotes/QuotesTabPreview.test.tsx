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
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '../../translations/i18n'
import { EmployeeDomains } from '../../configs/accessControls'
import { DashboardProvider } from '../../context/Dashboard.context'
import { QuoteDataProvider } from '../../context/Quote.provider'
import type { AppState } from '../../models/AppState.model'
import { DEFAULT_APP_CURRENCY } from '../../constants/currency'
import QuotesTabPreview from './QuotesTabPreview'

const quotesApi = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  updateQuote: vi.fn(),
}))
const shippingApi = vi.hoisted(() => ({ getZones: vi.fn() }))
const taxesApi = vi.hoisted(() => ({ calculateTax: vi.fn() }))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../../hooks/api/quotes', () => ({ useQuotesApi: () => quotesApi }))
vi.mock('../../hooks/api/shipping', () => ({
  useShippingApi: () => shippingApi,
}))
vi.mock('../../hooks/api/taxes', () => ({ useTaxesApi: () => taxesApi }))
vi.mock('../../hooks/api/prices', () => ({
  usePricesApi: () => ({ matchPrices: vi.fn() }),
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => permissions.granted.includes(domain),
    userScopes: [],
  }),
}))
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})

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

const fee = (amount: number) => ({
  minOrderValue: { amount: 0, currency: 'EUR' },
  cost: { amount, currency: 'EUR' },
})

const quote = {
  id: 'Q1',
  status: { value: 'CREATING' },
  businessModel: 'B2B',
  currency: 'EUR',
  siteCode: 'main',
  shippingAddress: { countryCode: 'DE' },
  validTo: '2026-12-01T10:00:00.000Z',
  comment: { employeeComment: 'For you' },
  customerReference: 'REF-1',
  customerComment: 'Please hurry',
  items: [
    {
      itemId: 'I1',
      product: { productId: 'P1', name: { en: 'Chair' } },
      quantity: { quantity: 2, unitCode: 'pcs' },
      price: {
        unitPrice: 130,
        newUnitPrice: 130,
        totalNetValue: 260,
        discount: 0,
        tax: { taxClass: 'STANDARD', taxRate: 19 },
      },
    },
  ],
  metadata: { mixins: {} },
}

const zones = [
  {
    id: 'Z1',
    shipTo: [{ country: 'DE' }],
    methods: [
      { id: 'M1', name: { en: 'DHL' }, shippingTaxCode: 'STD', fees: [fee(5)] },
      { id: 'M2', name: { en: 'Untaxed' }, fees: [fee(1)] },
      {
        id: 'M3',
        name: { en: 'Small orders' },
        shippingTaxCode: 'STD',
        maxOrderValue: { amount: 100, currency: 'EUR' },
        fees: [fee(2)],
      },
    ],
  },
  {
    id: 'Z2',
    shipTo: [{ country: 'FR' }],
    methods: [
      {
        id: 'M4',
        name: { en: 'France' },
        shippingTaxCode: 'STD',
        fees: [fee(3)],
      },
    ],
  },
]

const renderPreview = () =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={['/Q1']}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                <QuotesTabPreview />
              </QuoteDataProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )

const save = () =>
  screen.getAllByRole('button', { name: 'Save' })[0] as HTMLButtonElement

describe('QuotesTabPreview', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    quotesApi.getQuoteById.mockResolvedValue(quote)
    quotesApi.updateQuote.mockResolvedValue({})
    shippingApi.getZones.mockResolvedValue(zones)
    taxesApi.calculateTax.mockResolvedValue(5.95)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the priced lines, the texts and the subtotal', async () => {
    renderPreview()

    const table = await screen.findByTestId('quote-preview-table')
    // The lines come from the form, which is filled after the table mounts.
    expect(await within(table).findByText('Chair')).toBeTruthy()
    expect(within(table).getByText('19%')).toBeTruthy()
    expect(within(table).getByText('€309.40')).toBeTruthy()
    expect(
      (screen.getByTestId('quote-customer-reference-input') as HTMLInputElement)
        .value
    ).toBe('REF-1')
    expect(
      (screen.getByTestId('quote-comment-input') as HTMLTextAreaElement).value
    ).toBe('For you')
    await waitFor(() =>
      expect(shippingApi.getZones).toHaveBeenCalledWith('main')
    )
    // The subtotal follows once the shipping methods are known (MD).
    await waitFor(() =>
      expect(screen.getByText('Subtotal:').parentElement?.textContent).toBe(
        'Subtotal:€309.40'
      )
    )
  })

  // Requirement 10
  it("offers only the taxed methods of the address country's zones under their max order value", async () => {
    renderPreview()
    await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

    fireEvent.click(await screen.findByTestId('quote-shipping-method-control'))
    const options = (await screen.findAllByRole('option')).map(
      (option) => option.textContent
    )

    expect(options).toEqual(['DHL'])
  })

  it('saves the chosen shipping and the changed reference only', async () => {
    renderPreview()
    await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

    fireEvent.click(await screen.findByTestId('quote-shipping-method-control'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'DHL' }))
    await waitFor(() =>
      expect(taxesApi.calculateTax).toHaveBeenCalledWith(5, 'DE', 'STD')
    )
    await waitFor(() =>
      expect(screen.getByText('Total:').parentElement?.textContent).toBe(
        'Total:€315.35'
      )
    )
    fireEvent.change(screen.getByTestId('quote-customer-reference-input'), {
      target: { value: 'REF-2' },
    })
    await waitFor(() => expect(save().disabled).toBe(false))
    fireEvent.click(save())

    await waitFor(() =>
      expect(quotesApi.updateQuote).toHaveBeenCalledWith('Q1', [
        { op: 'REPLACE', path: '/customerReference', value: 'REF-2' },
        {
          op: 'REPLACE',
          path: '/shipping',
          value: {
            methodName: { en: 'DHL' },
            value: 5,
            methodId: 'M1',
            zoneId: 'Z1',
            shippingTaxCode: 'STD',
            grossValue: 5.95,
          },
        },
      ])
    )
    expect(toast.showToast).toHaveBeenCalledWith('Quote updated', '', 'success')
  })

  it('keeps everything read-only without Quotes Manager', async () => {
    permissions.granted = []
    renderPreview()

    await screen.findByTestId('quote-preview-table')
    expect(
      (screen.getByTestId('quote-customer-reference-input') as HTMLInputElement)
        .readOnly
    ).toBe(true)
    expect(save().disabled).toBe(true)
  })
})
