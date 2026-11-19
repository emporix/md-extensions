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
import { unpricedQuote } from '../../test/quoteNullFixtures'
import { Quote } from '../../models/Quotes.model'

const quotesApi = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  updateQuote: vi.fn(),
}))
const shippingApi = vi.hoisted(() => ({ getZones: vi.fn() }))
const taxesApi = vi.hoisted(() => ({ calculateTax: vi.fn(), getTax: vi.fn() }))
const pricesApi = vi.hoisted(() => ({ matchPrices: vi.fn() }))
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
  usePricesApi: () => pricesApi,
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

  // COP-7116: MD only logged a failed save.
  it('shows an error toast when the save fails', async () => {
    quotesApi.updateQuote.mockRejectedValue(new Error('Network Error'))
    renderPreview()
    await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

    // Save needs a shipping method, as in the save test below.
    fireEvent.click(await screen.findByTestId('quote-shipping-method-control'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'DHL' }))
    await waitFor(() =>
      expect(taxesApi.calculateTax).toHaveBeenCalledWith(5, 'DE', 'STD')
    )
    fireEvent.change(screen.getByTestId('quote-customer-reference-input'), {
      target: { value: 'REF-2' },
    })
    await waitFor(() => expect(save().disabled).toBe(false))
    fireEvent.click(save())

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while updating quote',
        '',
        'error'
      )
    )
  })

  // COP-7116 (Copilot on #158): MD left a failed zones request unhandled, so
  // the required shipping dropdown stayed empty without a message.
  it('shows an error toast when the shipping methods cannot be loaded', async () => {
    shippingApi.getZones.mockRejectedValue(new Error('Network Error'))
    renderPreview()

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while loading the shipping methods',
        '',
        'error'
      )
    )
  })

  // COP-7116 (Copilot on #158): MD left a failed re-pricing unhandled when a
  // line quantity changed, so the line kept its old totals without a message.
  it('shows an error toast and keeps the price when re-pricing a quantity fails', async () => {
    pricesApi.matchPrices.mockRejectedValue(new Error('Network Error'))
    renderPreview()
    const table = await screen.findByTestId('quote-preview-table')
    await within(table).findByText('Chair')

    const quantity = within(table).getByTestId('quote-item-quantity-0')
    const input = (quantity.querySelector('input') ?? quantity) as HTMLElement
    fireEvent.keyDown(input, {
      key: 'ArrowUp',
      code: 'ArrowUp',
      keyCode: 38,
      which: 38,
    })

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while loading the prices',
        '',
        'error'
      )
    )
    // Three chairs at the current €130: €390 net, €464.10 gross.
    await waitFor(() => expect(within(table).getByText('€464.10')).toBeTruthy())
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

  // COP-7125 (ported from MD quotesNullSafe.test.tsx, emporix/
  // management-dashboard#1707): items without a price and quotes without an
  // address.
  describe('unpriced items and quotes without an address', () => {
    const tableText = async () =>
      (await screen.findByTestId('quote-preview-table')).textContent ?? ''
    const totals = () => document.body.textContent ?? ''
    const spinUp = (testId: string) => {
      const field = screen.getByTestId(testId)
      fireEvent.keyDown(field.querySelector('input') ?? field, {
        key: 'ArrowUp',
        code: 'ArrowUp',
        keyCode: 38,
        which: 38,
      })
    }
    const withOneUnpriced = (overrides: Partial<Quote> = {}): Quote => {
      const base = unpricedQuote()
      return {
        ...base,
        items: [base.items[0]],
        ...overrides,
      } as Quote
    }

    it('warns about unpriced items in the singular and the plural', async () => {
      quotesApi.getQuoteById.mockResolvedValue(withOneUnpriced())
      renderPreview()
      expect(
        await screen.findByText('Totals exclude 1 unpriced item')
      ).toBeTruthy()

      cleanup()
      quotesApi.getQuoteById.mockResolvedValue(unpricedQuote())
      renderPreview()
      expect(
        await screen.findByText('Totals exclude 2 unpriced items')
      ).toBeTruthy()
    })

    it('has no warning once the quote is fully priced', async () => {
      renderPreview()
      await screen.findByTestId('quote-preview-table')
      expect(screen.queryByTestId('quote-unpriced-warning')).toBeNull()
    })

    it('shows unpriced rows as "Price on request" without NaN or undefined', async () => {
      quotesApi.getQuoteById.mockResolvedValue(unpricedQuote())
      renderPreview()

      await waitFor(async () =>
        expect((await tableText()).match(/PRICE ON REQUEST/g)).toHaveLength(2)
      )
      expect(totals()).not.toMatch(/NaN|undefined/)
    })

    it('saves an entered net price as the whole item with an EXTERNAL price and no tax', async () => {
      quotesApi.getQuoteById.mockResolvedValue(withOneUnpriced())
      renderPreview()
      await screen.findByTestId('quote-item-entered-net-price-0')

      spinUp('quote-item-entered-net-price-0')
      // No shipping address: no method can be chosen and none is required.
      await waitFor(() => expect(save().disabled).toBe(false))
      fireEvent.click(save())

      await waitFor(() =>
        expect(quotesApi.updateQuote).toHaveBeenCalledWith('q1', [
          {
            op: 'REPLACE',
            path: '/items/i1',
            value: {
              itemId: 'i1',
              quantity: { quantity: 2, unitCode: 'pcs' },
              priceStatus: 'MISSING',
              product: { productId: 'p1', name: { en: 'Unpriced product' } },
              price: { type: 'EXTERNAL', totalNetValue: 1 },
            },
          },
        ])
      )
      expect(taxesApi.getTax).not.toHaveBeenCalled()
    })

    it('offers the tax classes of the address country and sends the chosen class', async () => {
      taxesApi.getTax.mockResolvedValue({
        taxClasses: [{ code: 'STD', name: { en: 'Standard' }, rate: 19 }],
      })
      quotesApi.getQuoteById.mockResolvedValue(
        withOneUnpriced({
          shippingAddress: { id: 'A1', countryCode: 'DE' },
        } as Partial<Quote>)
      )
      renderPreview()

      fireEvent.click(
        await screen.findByTestId('quote-item-tax-class-0-control')
      )
      fireEvent.mouseDown(
        await screen.findByRole('option', { name: 'Standard' })
      )
      spinUp('quote-item-entered-net-price-0')
      // With an address the shipping method is required again.
      expect(save().disabled).toBe(true)
      fireEvent.click(screen.getByTestId('quote-shipping-method-control'))
      fireEvent.mouseDown(await screen.findByRole('option', { name: 'DHL' }))
      await waitFor(() => expect(save().disabled).toBe(false))
      fireEvent.click(save())

      await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled())
      const [, operations] = quotesApi.updateQuote.mock.calls[0]
      expect(operations[0]).toEqual({
        op: 'REPLACE',
        path: '/items/i1',
        value: expect.objectContaining({
          price: {
            type: 'EXTERNAL',
            totalNetValue: 1,
            tax: { taxClass: 'STD' },
          },
        }),
      })
      expect(operations[1].path).toBe('/shipping')
      expect(taxesApi.getTax).toHaveBeenCalledWith('DE')
    })

    it('shows no tax and no gross without a shipping address; totals are net', async () => {
      quotesApi.getQuoteById.mockResolvedValue({
        ...quote,
        shippingAddress: null,
      })
      renderPreview()

      const table = await screen.findByTestId('quote-preview-table')
      await within(table).findByText('Chair')
      expect(table.textContent).not.toContain('19%')
      expect(table.textContent).not.toContain('€309.40')
      // Subtotal is the net €260.
      await waitFor(() => expect(totals()).toContain('€260.00'))
    })
  })
})
