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
import { QuoteDataProvider, useQuoteData } from '../../context/Quote.provider'
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
/** Lets a test make the items builder return no operation (MD R9-3). */
const pricing = vi.hoisted(() => ({ noItemOperations: false, builds: 0 }))

vi.mock('../../helpers/quotePricing.helpers', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../helpers/quotePricing.helpers')>()
  return {
    ...actual,
    buildItemsUpdateOperations: (
      ...args: Parameters<typeof actual.buildItemsUpdateOperations>
    ) => {
      pricing.builds += 1
      return pricing.noItemOperations
        ? []
        : actual.buildItemsUpdateOperations(...args)
    },
  }
})
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

/** Reloads the quote, as a save on another tab does. */
const RefreshOnClick = () => {
  const { refreshData } = useQuoteData()
  return <button data-testid="refresh-quote" onClick={() => refreshData()} />
}

const renderPreview = ({ withRefresh = false } = {}) =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={['/Q1']}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                {withRefresh && <RefreshOnClick />}
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
const discard = () =>
  screen.getAllByRole('button', { name: 'Discard' })[0] as HTMLButtonElement

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

const taxClassControls = () =>
  screen.queryAllByTestId(/^quote-item-tax-class-\d+-control$/)
const totalsRow = (label: 'Subtotal' | 'Shipping Cost' | 'Total') =>
  screen.getByText(`${label}:`).parentElement?.textContent
const pageText = () => document.body.textContent ?? ''

const discountText = () =>
  (
    (screen.getByTestId('quote-item-discount-0').querySelector('input') ??
      screen.getByTestId('quote-item-discount-0')) as HTMLInputElement
  ).value

describe('QuotesTabPreview', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    pricing.noItemOperations = false
    pricing.builds = 0
    quotesApi.getQuoteById.mockResolvedValue(quote)
    quotesApi.updateQuote.mockResolvedValue({})
    shippingApi.getZones.mockResolvedValue(zones)
    taxesApi.calculateTax.mockResolvedValue(5.95)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  // The labels are tied to their fields (screen readers, click on the label).
  it('ties the labels of the text fields to their fields', async () => {
    renderPreview()
    await screen.findByTestId('quote-preview-table')

    const field = (label: RegExp) => screen.getByLabelText(label)
    expect(field(/^validity/i).tagName).toBe('INPUT')
    expect(field(/^comment$/i).tagName).toBe('TEXTAREA')
    expect(field(/customer reference/i).tagName).toBe('INPUT')
    expect(field(/customer comment/i).tagName).toBe('TEXTAREA')
    // Shipping method is a dropdown: its label names the group around it.
    expect(screen.getByRole('group', { name: /shipping method/i })).toBeTruthy()
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
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while updating quote',
        undefined
      )
    )
  })

  // COP-7116 (Copilot on #158): MD left a failed zones request unhandled, so
  // the required shipping dropdown stayed empty without a message.
  it('shows an error toast when the shipping methods cannot be loaded', async () => {
    shippingApi.getZones.mockRejectedValue(new Error('Network Error'))
    renderPreview()

    await waitFor(() =>
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading the shipping methods',
        undefined
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
      expect(toast.showError).toHaveBeenCalledWith(
        'Error while loading the prices',
        undefined
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

    it('shows unpriced rows as "Price on request" without NaN, undefined or null', async () => {
      quotesApi.getQuoteById.mockResolvedValue(unpricedQuote())
      renderPreview()

      await waitFor(async () =>
        expect((await tableText()).match(/PRICE ON REQUEST/g)).toHaveLength(2)
      )
      expect(await tableText()).toContain('Unpriced product')
      expect(totals()).not.toMatch(/NaN|undefined|null/)
    })

    it('saves an entered net price as the whole item with an EXTERNAL price and no tax', async () => {
      quotesApi.getQuoteById.mockResolvedValue(withOneUnpriced())
      renderPreview()
      await screen.findByTestId('quote-item-entered-net-price-0')
      // Before an address there is no tax class to choose.
      expect(taxClassControls()).toHaveLength(0)

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
      // Subtotal and total are the net €260.
      await waitFor(() =>
        expect(totalsRow('Subtotal')).toBe('Subtotal:€260.00')
      )
      expect(totalsRow('Total')).toBe('Total:€260.00')
    })
  })

  // COP-7125: the other cases of MD quotesNullSafe.test.tsx (emporix/
  // management-dashboard#1707) on this harness. MD's titles are kept, so a
  // case can be traced back. The remote's error toasts carry the API message
  // as the title (COP-7116), where MD put it in the detail.
  describe('MD quotesNullSafe cases', () => {
    const shippingOf = (overrides: Record<string, unknown> = {}) => ({
      methodName: { en: 'DHL' },
      value: 5,
      methodId: 'm',
      zoneId: 'z',
      shippingTaxCode: 'T',
      grossValue: 6,
      ...overrides,
    })
    const feeFrom = (minOrderValue: number, amount: number) => ({
      minOrderValue: { amount: minOrderValue, currency: 'EUR' },
      cost: { amount, currency: 'EUR' },
    })
    /** MD's single zone: DE with one taxed method `m`. */
    const zonesWith = ({
      fees = [feeFrom(0, 5)],
      maxOrderValue,
    }: {
      fees?: ReturnType<typeof feeFrom>[]
      maxOrderValue?: { amount: number; currency: string }
    } = {}) => [
      {
        id: 'z',
        shipTo: [{ country: 'DE' }],
        methods: [
          {
            id: 'm',
            name: { en: 'DHL' },
            shippingTaxCode: 'T',
            fees,
            ...(maxOrderValue ? { maxOrderValue } : {}),
          },
        ],
      },
    ]
    const taxClassesOf = (country: string) => ({
      location: { countryCode: country },
      locationCode: country,
      taxClasses: [
        { code: 'REDUCED', name: { en: 'Reduced' }, order: 2, rate: 7 },
        { code: 'STANDARD', name: { en: 'Standard' }, order: 1, rate: 19 },
        { code: 'ZERO', name: { en: 'Zero' }, order: 3, rate: 0 },
      ],
    })
    /** The gross the tax service returns for a non-zero shipping fee. */
    let shippingGross = 6

    const load = (value: Quote) =>
      quotesApi.getQuoteById.mockResolvedValue(value)
    const pricedQuoteWithOneItem = (): Quote =>
      ({
        ...unpricedQuote(),
        incompletePricing: false,
        items: [
          {
            itemId: 'i1',
            quantity: { quantity: 2, unitCode: 'pcs' },
            priceStatus: 'PRICED',
            product: { productId: 'p1', name: { en: 'Priced product' } },
            price: {
              priceId: 'pr',
              unitPrice: 50,
              newUnitPrice: 50,
              totalNetValue: 100,
              tax: { taxClass: 'STD', taxRate: 20 },
              discount: 0,
              currency: 'EUR',
            },
          },
        ],
      }) as Quote
    const withAddress = (country = 'DE', overrides: Partial<Quote> = {}) =>
      ({
        ...unpricedQuote(),
        shippingAddress: { countryCode: country },
        shipping: shippingOf(),
        ...overrides,
      }) as Quote
    const updateOperations = (call = 0): { path: string; value: never }[] =>
      quotesApi.updateQuote.mock.calls[call][1]
    const updatePaths = (call = 0) =>
      updateOperations(call).map((operation) => operation.path)
    const saved = async () => {
      await waitFor(() => expect(save().disabled).toBe(false))
      fireEvent.click(save())
      await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled())
    }
    const chooseOption = async (control: HTMLElement, label: string) => {
      fireEvent.click(control)
      fireEvent.mouseDown(await screen.findByRole('option', { name: label }))
    }
    const taxClassesShown = async (count: number) => {
      await waitFor(() => expect(taxClassControls()).toHaveLength(count))
      return taxClassControls()
    }
    const columnHeaders = () =>
      Array.from(document.querySelectorAll('th')).map((th) => th.textContent)

    beforeEach(() => {
      shippingGross = 6
      shippingApi.getZones.mockResolvedValue(zonesWith())
      taxesApi.calculateTax.mockImplementation(async (value: number) =>
        value === 0 ? 0 : shippingGross
      )
      taxesApi.getTax.mockImplementation(async (country: string) =>
        taxClassesOf(country)
      )
      pricesApi.matchPrices.mockResolvedValue([])
    })

    describe('preview tab pricing of unpriced items', () => {
      it('saves an entered net price as REPLACE /items/{id} with an EXTERNAL price and no tax when no class is picked', async () => {
        const withShipping = withAddress()
        load(withShipping)
        renderPreview()
        await taxClassesShown(2)

        typeNumber('quote-item-entered-net-price-0', '42.5')
        await saved()

        expect(quotesApi.updateQuote).toHaveBeenCalledWith('q1', [
          {
            op: 'REPLACE',
            path: '/items/i1',
            value: {
              ...withShipping.items[0],
              price: { type: 'EXTERNAL', totalNetValue: 42.5 },
            },
          },
        ])
      })

      it('a priced quote sends only REPLACE /items for a changed discount', async () => {
        load({
          ...pricedQuoteWithOneItem(),
          shippingAddress: { countryCode: 'DE' },
          shipping: shippingOf(),
        } as Quote)
        renderPreview()
        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€120.00')
        )

        typeNumber('quote-item-discount-0', '10')
        await saved()

        expect(updatePaths()).toEqual(['/items'])
        const echoed = (
          updateOperations()[0].value as { price: Record<string, number> }[]
        )[0].price
        expect(echoed.discount).toBe(10)
        expect(echoed.totalNetValue).toBe(90)
        expect(echoed.newUnitPrice).toBe(45)
      })

      describe('shipping method is optional without a shipping address', () => {
        it('a net price can be saved: valid form, only the price operation', async () => {
          load(unpricedQuote())
          renderPreview()
          await screen.findByTestId('quote-item-entered-net-price-0')
          expect(pageText()).not.toMatch(/Shipping Method\*/)

          typeNumber('quote-item-entered-net-price-0', '42.5')
          await saved()

          expect(updatePaths()).toEqual(['/items/i1'])
        })

        it('a changed comment can be saved without a shipping operation', async () => {
          load(unpricedQuote())
          renderPreview()

          fireEvent.change(await screen.findByTestId('quote-comment-input'), {
            target: { value: 'Hello' },
          })
          await saved()

          expect(updatePaths()).toEqual(['/comment'])
        })

        it('an existing shipping is not cleared when there is no address', async () => {
          load({ ...unpricedQuote(), shipping: shippingOf() } as Quote)
          renderPreview()
          await screen.findByTestId('quote-item-entered-net-price-0')

          typeNumber('quote-item-entered-net-price-0', '5')
          await saved()

          expect(updatePaths()).toEqual(['/items/i1'])
        })
      })

      describe('shipping method stays required with a shipping address', () => {
        const withAddressNoMethod = () =>
          ({
            ...unpricedQuote(),
            shippingAddress: { countryCode: 'DE' },
          }) as Quote

        it('Save stays disabled until a method is chosen', async () => {
          load(withAddressNoMethod())
          renderPreview()
          await screen.findByTestId('quote-item-entered-net-price-0')
          expect(pageText()).toMatch(/Shipping Method\*/)

          typeNumber('quote-item-entered-net-price-0', '42.5')

          // The price makes the form dirty; only the missing method blocks it.
          await waitFor(() => expect(discard().disabled).toBe(false))
          expect(save().disabled).toBe(true)
        })

        it('a chosen method is sent as /shipping', async () => {
          load(withAddressNoMethod())
          renderPreview()
          await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

          await chooseOption(
            await screen.findByTestId('quote-shipping-method-control'),
            'DHL'
          )
          await saved()

          expect(updatePaths()).toEqual(['/shipping'])
        })
      })

      it('shows the backend cause when saving fails', async () => {
        load(withAddress())
        quotesApi.updateQuote.mockRejectedValue({
          response: { data: { message: 'Missing scope' } },
        })
        renderPreview()
        await screen.findByTestId('quote-item-entered-net-price-0')

        typeNumber('quote-item-entered-net-price-0', '10')
        await saved()

        await waitFor(() =>
          expect(toast.showError).toHaveBeenCalledWith(
            'Error while updating quote',
            'Missing scope'
          )
        )
      })
    })

    describe('preview: several rows in one save and German plural', () => {
      const unpriced = (itemId: string, name: string) => ({
        itemId,
        quantity: { quantity: 1, unitCode: 'pcs' },
        priceStatus: 'MISSING',
        product: { productId: itemId, name: { en: name } },
      })
      /** A priced row (€100 net, 20 %) and two unpriced rows, with address. */
      const mixedQuote = (): Quote => {
        const priced = pricedQuoteWithOneItem()
        return {
          ...priced,
          incompletePricing: true,
          shippingAddress: { countryCode: 'DE' },
          shipping: shippingOf(),
          items: [
            ...priced.items,
            unpriced('i2', 'Second'),
            unpriced('i3', 'Third'),
          ],
        } as Quote
      }
      /** `quote` after the second row got €50 net (EXTERNAL, 20 %). */
      const withSecondRowPriced = (
        value: Quote,
        totalNetValue = 50
      ): Quote => ({
        ...value,
        incompletePricing: false,
        items: [
          value.items[0],
          {
            ...value.items[1],
            priceStatus: 'PRICED',
            price: {
              priceId: null,
              type: 'EXTERNAL',
              unitPrice: totalNetValue,
              newUnitPrice: totalNetValue,
              totalNetValue,
              tax: { taxClass: 'STD', taxRate: 20 },
              discount: 0,
              currency: 'EUR',
            },
          } as Quote['items'][number],
        ],
      })

      it('echo first, then one item operation per entered row', async () => {
        load(mixedQuote())
        renderPreview()
        await taxClassesShown(2)
        // Only the unpriced rows get a tax class.
        expect(
          screen.queryByTestId('quote-item-tax-class-0-control')
        ).toBeNull()

        typeNumber('quote-item-discount-0', '10')
        typeNumber('quote-item-entered-net-price-1', '7')
        typeNumber('quote-item-entered-net-price-2', '9')
        await saved()

        const operations = updateOperations() as {
          path: string
          value: {
            price?: Record<string, unknown> | null
            product?: { productId: string }
          } & { price?: Record<string, unknown> | null }[]
        }[]
        expect(operations.map((operation) => operation.path)).toEqual([
          '/items',
          '/items/i2',
          '/items/i3',
        ])
        expect(operations[1].value.price).toEqual({
          totalNetValue: 7,
          type: 'EXTERNAL',
        })
        expect(operations[2].value.price).toEqual({
          totalNetValue: 9,
          type: 'EXTERNAL',
        })
        expect(operations[1].value.product?.productId).toBe('i2')
        const echo = operations[0].value
        expect(echo[0].price?.discount).toBe(10)
        expect(echo[1].price).toBeNull()
        expect(echo[2].price).toBeNull()
      })

      it('subtotal and total include a newly priced row after save and refresh', async () => {
        const twoRows = mixedQuote()
        twoRows.items = twoRows.items.slice(0, 2)
        load(twoRows)
        renderPreview()
        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€120.00')
        )
        expect(screen.getByText('Totals exclude 1 unpriced item')).toBeTruthy()

        typeNumber('quote-item-entered-net-price-1', '50')
        // The save reloads the quote, now with the second row priced.
        await waitFor(() => expect(save().disabled).toBe(false))
        load(withSecondRowPriced(twoRows))
        fireEvent.click(save())

        await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled())
        expect(updatePaths()[0]).toBe('/items/i2')
        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€180.00')
        )
        expect(screen.queryByText(/Totals exclude/)).toBeNull()
        expect(totalsRow('Total')).toBe('Total:€186.00')
      })

      describe('shipping re-picked after the totals changed', () => {
        const shippingToast =
          'Shipping cost was updated because the totals changed'
        const shippingToasts = () =>
          toast.showToast.mock.calls.filter((call) => call[0] === shippingToast)
        /** Prices the second row, saves and waits for the reloaded quote. */
        const priceRowAndRefresh = async () => {
          const twoRows = mixedQuote()
          twoRows.items = twoRows.items.slice(0, 2)
          load(twoRows)
          renderPreview({ withRefresh: true })
          await waitFor(() =>
            expect(totalsRow('Subtotal')).toBe('Subtotal:€120.00')
          )
          typeNumber('quote-item-entered-net-price-1', '50')
          await waitFor(() => expect(save().disabled).toBe(false))
          const refreshed = withSecondRowPriced(twoRows)
          load(refreshed)
          fireEvent.click(save())
          await waitFor(() =>
            expect(totalsRow('Subtotal')).toBe('Subtotal:€180.00')
          )
          quotesApi.updateQuote.mockClear()
          return refreshed
        }

        it('an unchanged shipping keeps the form clean and silent', async () => {
          load(mixedQuote())
          renderPreview()
          await waitFor(() =>
            expect(taxesApi.calculateTax).toHaveBeenCalledWith(5, 'DE', 'T')
          )

          expect(save().disabled).toBe(true)
          expect(shippingToasts()).toHaveLength(0)
        })

        it('a fee that changes with the totals enables Save, toasts once and is sent as /shipping', async () => {
          shippingApi.getZones.mockResolvedValue(
            zonesWith({ fees: [feeFrom(0, 5), feeFrom(150, 0)] })
          )
          await priceRowAndRefresh()

          await waitFor(() =>
            expect(shippingToasts()).toEqual([[shippingToast, '', 'info']])
          )
          await saved()
          expect(updatePaths()).toEqual(['/shipping'])
          const shipping = updateOperations()[0].value as {
            value: number
            grossValue: number
          }
          expect(shipping.value).toBe(0)
          expect(shipping.grossValue).toBe(0)
        })

        it('a method that is no longer allowed is cleared, with one toast', async () => {
          shippingApi.getZones.mockResolvedValue(
            zonesWith({ maxOrderValue: { amount: 150, currency: 'EUR' } })
          )
          await priceRowAndRefresh()

          await waitFor(() => expect(shippingToasts()).toHaveLength(1))
          expect(save().disabled).toBe(true)
        })

        it('a stored gross rounded to cents is the same shipping: clean and silent on open and remount', async () => {
          shippingGross = 5.9381
          load({
            ...mixedQuote(),
            shipping: shippingOf({ value: 5, grossValue: 5.94 }),
          } as Quote)
          const opened = renderPreview()
          await waitFor(() => expect(taxesApi.calculateTax).toHaveBeenCalled())
          expect(save().disabled).toBe(true)

          const picksBefore = taxesApi.calculateTax.mock.calls.length
          opened.unmount()
          renderPreview()
          await waitFor(() =>
            expect(taxesApi.calculateTax.mock.calls.length).toBeGreaterThan(
              picksBefore
            )
          )
          expect(save().disabled).toBe(true)
          expect(shippingToasts()).toHaveLength(0)
        })

        describe.each([
          ['a completed quote', { status: { value: 'ACCEPTED' } }, () => {}],
          [
            'a user who cannot manage quotes',
            {},
            () => {
              permissions.granted = []
            },
          ],
        ])('%s', (_name, overrides, setup) => {
          it('shows drifted shipping without dirty form or toast', async () => {
            setup()
            load({
              ...mixedQuote(),
              ...overrides,
              shipping: shippingOf({ value: 9, grossValue: 11 }),
            } as Quote)
            renderPreview()
            await waitFor(() =>
              expect(taxesApi.calculateTax).toHaveBeenCalled()
            )

            expect(shippingToasts()).toHaveLength(0)
            expect(save().disabled).toBe(true)
            expect(discard().disabled).toBe(true)
          })
        })

        it('a second refresh with the same picked shipping does not toast twice', async () => {
          shippingApi.getZones.mockResolvedValue(
            zonesWith({ fees: [feeFrom(0, 5), feeFrom(150, 0)] })
          )
          const refreshed = await priceRowAndRefresh()
          await waitFor(() => expect(shippingToasts()).toHaveLength(1))

          // Another reload: new totals in the same fee tier, old shipping.
          load(withSecondRowPriced(refreshed, 60))
          fireEvent.click(screen.getByTestId('refresh-quote'))
          await waitFor(() =>
            expect(totalsRow('Subtotal')).toBe('Subtotal:€192.00')
          )

          expect(shippingToasts()).toHaveLength(1)
        })
      })

      describe('German plural of the unpriced warning', () => {
        it.each([
          [1, 'Die Summen enthalten 1 Position ohne Preis'],
          [2, 'Die Summen enthalten 2 Positionen ohne Preis'],
        ])('%i unpriced item(s)', async (count, expected) => {
          await i18n.changeLanguage('de')
          const value = unpricedQuote()
          value.items = value.items.slice(0, count)
          load(value)
          renderPreview()

          expect(await screen.findByText(expected)).toBeTruthy()
        })
      })
    })

    describe('preview: tax class of hand-entered (EXTERNAL) prices', () => {
      const externalQuote = (withClass: boolean): Quote =>
        withAddress('DE', {
          incompletePricing: false,
          items: [
            {
              itemId: 'i1',
              quantity: { quantity: 2, unitCode: 'pcs' },
              priceStatus: 'PRICED',
              product: { productId: 'p1', name: { en: 'Hand priced' } },
              price: {
                priceId: null,
                type: 'EXTERNAL',
                unitPrice: 50,
                newUnitPrice: 50,
                totalNetValue: 100,
                ...(withClass
                  ? { tax: { taxClass: 'REDUCED', taxRate: 7 } }
                  : {}),
                discount: 0,
                currency: 'EUR',
              },
            },
          ],
        } as Partial<Quote>)
      const catalogPricedWithAddress = () =>
        ({
          ...pricedQuoteWithOneItem(),
          shippingAddress: { countryCode: 'DE' },
        }) as Quote

      it('loads the classes of the country of the shipping address', async () => {
        load(withAddress('AT'))
        renderPreview()

        await taxClassesShown(2)
        expect(taxesApi.getTax).toHaveBeenCalledWith('AT')
      })

      it('the dropdown starts empty and an untouched dropdown sends no tax', async () => {
        load(withAddress())
        renderPreview()
        const [first] = await taxClassesShown(2)
        expect(first.textContent).toContain('Select tax class')
        expect(first.textContent).not.toContain('Standard')

        typeNumber('quote-item-entered-net-price-0', '12')
        await saved()

        expect(
          (updateOperations()[0].value as { price: unknown }).price
        ).toEqual({ type: 'EXTERNAL', totalNetValue: 12 })
      })

      it('a class with the rate 0 is a class and is sent', async () => {
        load(withAddress())
        renderPreview()
        const [first] = await taxClassesShown(2)

        typeNumber('quote-item-entered-net-price-0', '0')
        await chooseOption(first, 'Zero')
        await saved()

        const { price } = updateOperations()[0].value as {
          price: { totalNetValue: number; tax: unknown }
        }
        expect(price.totalNetValue).toBe(0)
        expect(price.tax).toEqual({ taxClass: 'ZERO' })
      })

      it('a catalog price row has no dropdown', async () => {
        load(catalogPricedWithAddress())
        renderPreview()
        await screen.findByTestId('quote-item-discount-0')
        await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

        expect(taxClassControls()).toHaveLength(0)
      })

      it('an EXTERNAL row shows its class and a changed class is sent in the echo as the class only', async () => {
        load(externalQuote(true))
        renderPreview()
        const [first] = await taxClassesShown(1)
        await waitFor(() => expect(first.textContent).toContain('Reduced'))

        await chooseOption(first, 'Standard')
        await saved()

        expect(updatePaths()).toEqual(['/items'])
        const [echoed] = updateOperations()[0].value as {
          price: { tax: unknown; priceId: unknown }
        }[]
        expect(echoed.price.tax).toEqual({ taxClass: 'STANDARD' })
        expect(echoed.price.priceId).toBeNull()
      })

      it('an EXTERNAL row without a class asks for one and shows no tax and no gross', async () => {
        load(externalQuote(false))
        renderPreview()
        const [first] = await taxClassesShown(1)
        expect(first.textContent).toContain('Select tax class')
        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€100.00')
        )
        expect(
          screen.getByTestId('quote-preview-table').textContent
        ).not.toContain('7%')
        expect(pageText()).not.toMatch(/NaN|undefined|null/)

        await chooseOption(first, 'Reduced')
        await saved()

        const [echoed] = updateOperations()[0].value as {
          price: { tax: unknown }
        }[]
        expect(echoed.price.tax).toEqual({ taxClass: 'REDUCED' })
      })

      it('tax and gross appear when the backend returns the rate', async () => {
        load(externalQuote(true))
        renderPreview()

        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€107.00')
        )
        const table = screen.getByTestId('quote-preview-table')
        expect(table.textContent).toContain('7%')
        expect(table.textContent).toContain('€107.00')
      })

      it('an untouched EXTERNAL row without a class sends nothing and Save stays disabled', async () => {
        load(externalQuote(false))
        renderPreview()
        await taxClassesShown(1)

        expect(save().disabled).toBe(true)
      })

      it('classes that cannot be loaded show a message, do not crash, and the net price is still sent', async () => {
        taxesApi.getTax.mockRejectedValue({ response: { status: 403 } })
        load(withAddress())
        renderPreview()

        expect(
          await screen.findByText(/Tax classes could not be loaded/)
        ).toBeTruthy()
        expect(pageText()).toContain('catalog tax class')
        expect(pageText()).not.toContain('saved without a tax class')
        expect(taxClassControls()).toHaveLength(0)

        typeNumber('quote-item-entered-net-price-0', '12')
        await saved()

        expect(
          'tax' in (updateOperations()[0].value as { price: object }).price
        ).toBe(false)
      })

      it('a country without tax classes shows a message', async () => {
        taxesApi.getTax.mockResolvedValue({
          ...taxClassesOf('DE'),
          taxClasses: [],
        })
        load(withAddress())
        renderPreview()

        expect(
          await screen.findByText(
            'No tax classes for the country of the shipping address.'
          )
        ).toBeTruthy()
      })

      it('no message is shown when no row needs a class', async () => {
        taxesApi.getTax.mockRejectedValue(new Error('x'))
        load(catalogPricedWithAddress())
        renderPreview()
        await screen.findByTestId('quote-item-discount-0')
        await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

        expect(screen.queryByText(/Tax classes could not be loaded/)).toBeNull()
      })

      it.each([
        [
          '403 (missing scope)',
          'Missing scope cart.cart_manage_external_prices',
        ],
        [
          '400 (EXTERNAL item without a class)',
          'Tax class is missing for item i1',
        ],
      ])('shows the backend cause for %s', async (_name, message) => {
        load(withAddress())
        quotesApi.updateQuote.mockRejectedValue({
          response: { data: { message } },
        })
        renderPreview()
        await screen.findByTestId('quote-item-entered-net-price-0')

        typeNumber('quote-item-entered-net-price-0', '10')
        await saved()

        await waitFor(() =>
          expect(toast.showError).toHaveBeenCalledWith(
            'Error while updating quote',
            message
          )
        )
      })

      it.each([
        [
          'a user who cannot manage quotes',
          {},
          () => {
            permissions.granted = []
          },
        ],
        ['a completed quote', { status: { value: 'ACCEPTED' } }, () => {}],
      ])(
        'R10-4: %s neither loads the classes nor sees the class messages',
        async (_name, overrides, setup) => {
          setup()
          taxesApi.getTax.mockRejectedValue({ response: { status: 403 } })
          load(withAddress('DE', overrides as Partial<Quote>))
          renderPreview()
          await screen.findByTestId('quote-item-entered-net-price-0')
          await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

          expect(taxesApi.getTax).not.toHaveBeenCalled()
          expect(
            screen.queryByText(/Tax classes could not be loaded/)
          ).toBeNull()
          expect(taxClassControls()).toHaveLength(0)
        }
      )

      it('R10-4: a user who cannot manage quotes sees no empty-classes message', async () => {
        permissions.granted = []
        taxesApi.getTax.mockResolvedValue({
          ...taxClassesOf('DE'),
          taxClasses: [],
        })
        load(withAddress())
        renderPreview()
        await screen.findByTestId('quote-item-entered-net-price-0')
        await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

        expect(screen.queryByText(/No tax classes for the country/)).toBeNull()
      })

      it('a class picked on an unpriced row without a net price does not enable Save and sends nothing', async () => {
        load(withAddress())
        renderPreview()
        const [first] = await taxClassesShown(2)

        await chooseOption(first, 'Reduced')
        await waitFor(() => expect(first.textContent).toContain('Reduced'))

        expect(save().disabled).toBe(true)
        fireEvent.click(save())
        expect(quotesApi.updateQuote).not.toHaveBeenCalled()
      })

      it('without calculated tax the Total adds the net shipping to the net subtotal', async () => {
        load(externalQuote(false))
        renderPreview()

        await waitFor(() =>
          expect(totalsRow('Shipping Cost')).toBe('Shipping Cost:€5.00')
        )
        // The subtotal follows the shipping cost by one render.
        await waitFor(() => {
          expect(totalsRow('Subtotal')).toBe('Subtotal:€100.00')
          expect(totalsRow('Total')).toBe('Total:€105.00')
        })
        expect(pageText()).not.toContain('106.00')
      })

      it('after a class change the old rate and gross are hidden until the save', async () => {
        load(externalQuote(true))
        renderPreview()
        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€107.00')
        )
        const table = screen.getByTestId('quote-preview-table')
        expect(table.textContent).toContain('7%')

        await chooseOption((await taxClassesShown(1))[0], 'Standard')

        await waitFor(() =>
          expect(totalsRow('Subtotal')).toBe('Subtotal:€100.00')
        )
        expect(table.textContent).not.toContain('7%')
        expect(pageText()).not.toContain('107.00')
        expect(totalsRow('Total')).toBe('Total:€105.00')
      })

      it('R9-2: classes of the old country are not offered while the new country loads', async () => {
        load(withAddress('DE'))
        renderPreview({ withRefresh: true })
        await taxClassesShown(2)

        taxesApi.getTax.mockImplementation(() => new Promise(() => undefined))
        load(withAddress('AT'))
        fireEvent.click(screen.getByTestId('refresh-quote'))

        await waitFor(() => expect(taxesApi.getTax).toHaveBeenCalledWith('AT'))
        expect(taxClassControls()).toHaveLength(0)
      })

      it('R9-3: Save with nothing to send resets the form instead of staying dirty', async () => {
        pricing.noItemOperations = true
        load(pricedQuoteWithOneItem())
        renderPreview()
        await screen.findByTestId('quote-item-discount-0')

        typeNumber('quote-item-discount-0', '10')
        await waitFor(() => expect(save().disabled).toBe(false))
        fireEvent.click(save())

        await waitFor(() => expect(save().disabled).toBe(true))
        expect(pricing.builds).toBeGreaterThan(0)
        expect(quotesApi.updateQuote).not.toHaveBeenCalled()
      })

      it('R9-4: the tax service is not called when no row needs a class', async () => {
        load(catalogPricedWithAddress())
        renderPreview()
        await screen.findByTestId('quote-item-discount-0')
        await waitFor(() => expect(shippingApi.getZones).toHaveBeenCalled())

        expect(taxesApi.getTax).not.toHaveBeenCalled()
      })

      it('R9-6: no tax class column header when there is no dropdown', async () => {
        load(catalogPricedWithAddress())
        const catalogOnly = renderPreview()
        await screen.findByTestId('quote-item-discount-0')
        expect(columnHeaders()).not.toContain('Tax class')

        catalogOnly.unmount()
        load(withAddress())
        renderPreview()
        await taxClassesShown(2)
        expect(columnHeaders()).toContain('Tax class')
      })
    })
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
