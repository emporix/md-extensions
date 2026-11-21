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

/**
 * Types into a CL InputNumber key by key, as a user does: CL reports a change
 * on each key press (a value written to the element is only read on blur,
 * which CL does not report). The current text is selected first, so it is
 * replaced.
 */
const typeNumber = (testId: string, text: string) => {
  const field = screen.getByTestId(testId)
  const input = (field.querySelector('input') ?? field) as HTMLInputElement
  input.focus()
  input.setSelectionRange(0, input.value.length)
  for (const char of text) {
    fireEvent.keyPress(input, { key: char, charCode: char.charCodeAt(0) })
  }
}

const discountText = () =>
  (
    (screen.getByTestId('quote-item-discount-0').querySelector('input') ??
      screen.getByTestId('quote-item-discount-0')) as HTMLInputElement
  ).value

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

  // COP-7116 QA (Maryna, 2026-11-20).
  describe('QA findings', () => {
    const chairAt = (
      newUnitPrice: number,
      discount: number,
      tax: unknown = { taxClass: 'STANDARD', taxRate: 19 }
    ) => ({
      ...quote,
      items: [
        {
          ...quote.items[0],
          price: {
            unitPrice: 130,
            newUnitPrice,
            totalNetValue: newUnitPrice * 2,
            discount,
            ...(tax ? { tax } : {}),
          },
        },
      ],
    })
    /** match-prices for a quantity in a cheaper tier: 100 instead of 130. */
    const cheaperTier = () =>
      pricesApi.matchPrices.mockResolvedValue([
        {
          priceId: 'PR1',
          itemId: { itemType: 'PRODUCT', id: 'P1' },
          originalValue: 100,
          quantity: { quantity: 3, unitCode: 'pcs' },
          tax: { taxClass: 'STANDARD', taxRate: 19 },
        },
      ])
    const spinQuantityUp = (table: HTMLElement) => {
      const quantity = within(table).getByTestId('quote-item-quantity-0')
      fireEvent.keyDown(quantity.querySelector('input') ?? quantity, {
        key: 'ArrowUp',
        code: 'ArrowUp',
        keyCode: 38,
        which: 38,
      })
    }

    it('keeps the discount when a new quantity reaches a cheaper price tier', async () => {
      // 10% off the list price of 130: 117 a piece.
      quotesApi.getQuoteById.mockResolvedValue(chairAt(117, 10))
      cheaperTier()
      renderPreview()
      const table = await screen.findByTestId('quote-preview-table')
      await within(table).findByText('Chair')

      spinQuantityUp(table)

      // Three chairs at 10% off 100: €270 net, €321.30 gross.
      await waitFor(() =>
        expect(within(table).getByText('€321.30')).toBeTruthy()
      )
      expect(discountText()).toBe('10%')
    })

    it('does not turn the discount negative without one', async () => {
      quotesApi.getQuoteById.mockResolvedValue(chairAt(130, 0))
      cheaperTier()
      renderPreview()
      const table = await screen.findByTestId('quote-preview-table')
      await within(table).findByText('Chair')

      spinQuantityUp(table)

      // Three chairs at the tier price of 100: €300 net, €357 gross. MD kept
      // 130 a piece: €390 net and a discount of -30%.
      await waitFor(() =>
        expect(within(table).getByText('€357.00')).toBeTruthy()
      )
      expect(discountText()).toBe('0%')
    })

    it('shows a line whose price has no tax instead of failing', async () => {
      quotesApi.getQuoteById.mockResolvedValue(chairAt(130, 0, null))
      renderPreview()

      const table = await screen.findByTestId('quote-preview-table')
      expect(await within(table).findByText('Chair')).toBeTruthy()
      expect(table.textContent).not.toContain('undefined')
      expect(table.textContent).not.toContain('NaN')
      // No rate, so no gross; the subtotal counts the net €260.
      await waitFor(() =>
        expect(screen.getByText('Subtotal:').parentElement?.textContent).toBe(
          'Subtotal:€260.00'
        )
      )
    })

    it('shows the chosen number of rows per page', async () => {
      quotesApi.getQuoteById.mockResolvedValue({
        ...quote,
        items: Array.from({ length: 7 }, (_, index) => ({
          ...quote.items[0],
          itemId: `I${index}`,
          product: { productId: `P${index}`, name: { en: `Chair ${index}` } },
        })),
      })
      renderPreview()
      const table = await screen.findByTestId('quote-preview-table')
      await within(table).findByText('Chair 0')
      expect(within(table).queryByText('Chair 6')).toBeNull()

      // The paginator's rows-per-page dropdown (Prime) offers 5, 10 and 15.
      fireEvent.click(
        table.querySelector('.p-paginator .p-dropdown') as HTMLElement
      )
      const ten = Array.from(
        document.querySelectorAll('li.p-dropdown-item')
      ).find((option) => option.textContent === '10') as HTMLElement
      fireEvent.click(ten)

      expect(await within(table).findByText('Chair 6')).toBeTruthy()
    })
  })

  // A typed discount stays between 0 and 100%. MD took any number, so a
  // discount of 125% gave negative prices.
  describe('discount limit', () => {
    // Two chairs at the list price of 130.
    const openChair = async () => {
      renderPreview()
      const table = await screen.findByTestId('quote-preview-table')
      await within(table).findByText('Chair')
      await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())
      return table
    }

    it('caps a typed discount at 100% and saves the capped line', async () => {
      const table = await openChair()

      typeNumber('quote-item-discount-0', '150')

      await waitFor(() => expect(discountText()).toBe('100%'))
      // 150% gave a unit price of -€65.00.
      expect(within(table).getAllByText('€0.00').length).toBeGreaterThan(0)
      expect(table.textContent).not.toContain('-€')
      // Save needs a shipping method.
      fireEvent.click(screen.getByTestId('quote-shipping-method-control'))
      fireEvent.mouseDown(await screen.findByRole('option', { name: 'DHL' }))
      await waitFor(() => expect(save().disabled).toBe(false))
      fireEvent.click(save())
      await waitFor(() =>
        expect(quotesApi.updateQuote).toHaveBeenCalledWith(
          'Q1',
          expect.arrayContaining([
            {
              op: 'REPLACE',
              path: '/items',
              value: [
                expect.objectContaining({
                  price: expect.objectContaining({
                    discount: 100,
                    newUnitPrice: 0,
                    totalNetValue: 0,
                  }),
                }),
              ],
            },
          ])
        )
      )
    })

    it('ignores a minus sign typed into the discount', async () => {
      const table = await openChair()

      typeNumber('quote-item-discount-0', '-5')

      // 5% off 130.
      await waitFor(() => expect(discountText()).toBe('5%'))
      expect(within(table).getByText('€123.50')).toBeTruthy()
    })

    it('takes a decimal discount typed with a dot', async () => {
      const table = await openChair()

      typeNumber('quote-item-discount-0', '12.5')

      // 12.5% off 130.
      await waitFor(() => expect(discountText()).toBe('12.5%'))
      expect(within(table).getByText('€113.75')).toBeTruthy()
    })

    it('shows the negative discount of a line whose net price is above the list price', async () => {
      await openChair()

      // €312 for two chairs: 156 a piece, 20% above the list price.
      typeNumber('quote-item-net-price-0', '312')

      await waitFor(() => expect(discountText()).toBe('-20%'))
    })
  })
})
