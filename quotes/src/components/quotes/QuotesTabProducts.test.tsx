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
import { unpricedQuote } from '../../test/quoteNullFixtures'
import QuotesTabProducts from './QuotesTabProducts'

const quotesApi = vi.hoisted(() => ({
  getQuoteById: vi.fn(),
  updateQuote: vi.fn(),
}))
const productsApi = vi.hoisted(() => ({ syncPaginatedProducts: vi.fn() }))
const categoriesApi = vi.hoisted(() => ({ getCategoryTrees: vi.fn() }))
const pricesApi = vi.hoisted(() => ({ matchPrices: vi.fn() }))
const toast = vi.hoisted(() => ({
  showToast: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))
const permissions = vi.hoisted(() => ({ granted: [] as string[] }))

vi.mock('../../hooks/api/quotes', () => ({ useQuotesApi: () => quotesApi }))
vi.mock('../../hooks/api/products', () => ({
  useProductsApi: () => productsApi,
}))
vi.mock('../../hooks/api/categories', () => ({
  useCategoriesApi: () => categoriesApi,
}))
vi.mock('../../hooks/api/prices', () => ({ usePricesApi: () => pricesApi }))
const sites = vi.hoisted(() => ({
  value: [{ code: 'main', shipToCountries: ['AT'] }] as unknown[],
}))
vi.mock('../../context/SitesProvider', () => ({
  useSites: () => ({ sites: sites.value }),
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

const chairLine = {
  itemId: 'I1',
  product: { productId: 'P1', name: { en: 'Chair' } },
  quantity: { quantity: 2, unitCode: 'pcs' },
  price: { unitPrice: 130, newUnitPrice: 130, totalNetValue: 260 },
}

const quote = {
  id: 'Q1',
  status: { value: 'CREATING' },
  businessModel: 'B2B',
  currency: 'EUR',
  siteCode: 'main',
  shippingAddress: { countryCode: 'DE' },
  items: [chairLine],
  metadata: { mixins: {} },
}

/** The tab opened once the quote is loaded, as when a user switches to it. */
const ProductsOnceLoaded = () =>
  useQuoteData().quote ? <QuotesTabProducts /> : null

const renderProducts = ({ openAfterLoad = false } = {}) =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={['/Q1']}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                {openAfterLoad ? <ProductsOnceLoaded /> : <QuotesTabProducts />}
              </QuoteDataProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )

const save = () => screen.getByRole('button', { name: 'Save' })

/** Opens the picker dialog and waits for its products. */
const openPicker = async () => {
  fireEvent.click(await screen.findByTestId('quote-select-products'))
  const browser = await screen.findByTestId('quote-products-browser')
  await waitFor(() => expect(within(browser).getByText('Table')).toBeTruthy())
  return browser
}

const checkProduct = (browser: HTMLElement, name: string) => {
  const row = within(browser).getByText(name).closest('tr') as HTMLElement
  fireEvent.click(row.querySelector('.p-checkbox-box') as HTMLElement)
}

const apply = () =>
  screen.getByTestId('quote-apply-products') as HTMLButtonElement

describe('QuotesTabProducts', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    permissions.granted = [EmployeeDomains.QUOTES_MANAGER]
    quotesApi.getQuoteById.mockResolvedValue(quote)
    quotesApi.updateQuote.mockResolvedValue({})
    productsApi.syncPaginatedProducts.mockResolvedValue({
      data: [
        { id: 'P1', code: 'CH', name: { en: 'Chair' } },
        { id: 'P2', code: 'TB', name: { en: 'Table' } },
      ],
      totalCount: 2,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lists the quote lines and loads no products before the picker opens', async () => {
    renderProducts()

    const selected = await screen.findByTestId('quote-selected-items')
    expect(within(selected).getByText('Chair')).toBeTruthy()
    expect(within(selected).getByText('P1')).toBeTruthy()
    expect(screen.queryByTestId('quote-products-browser')).toBeNull()
    expect(productsApi.syncPaginatedProducts).not.toHaveBeenCalled()
    expect((save() as HTMLButtonElement).disabled).toBe(true)
  })

  it('opens the products picker in a dialog', async () => {
    renderProducts()
    const browser = await openPicker()

    expect(productsApi.syncPaginatedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ currentPage: 1, rows: 10 })
    )
    // Without Categories Viewer the tree is never requested.
    expect(categoriesApi.getCategoryTrees).not.toHaveBeenCalled()
    // The products of the quote come checked, and nothing changed yet.
    const chairRow = within(browser).getByText('Chair').closest('tr')
    expect(chairRow?.querySelector('.p-checkbox-box.p-highlight')).toBeTruthy()
    expect(apply().disabled).toBe(true)
  })

  it('keeps the quote lines when the dialog closes without applying', async () => {
    renderProducts()
    const browser = await openPicker()

    checkProduct(browser, 'Table')
    expect(apply().disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() =>
      expect(screen.queryByTestId('quote-products-browser')).toBeNull()
    )
    const selected = screen.getByTestId('quote-selected-items')
    expect(within(selected).queryByText('Table')).toBeNull()
    expect((save() as HTMLButtonElement).disabled).toBe(true)
  })

  // COP-7116: MD only logged a failed save.
  it('shows an error toast when the save fails', async () => {
    quotesApi.updateQuote.mockRejectedValue(new Error('Network Error'))
    renderProducts()

    fireEvent.click(await screen.findByTestId('quote-remove-product-P1'))
    fireEvent.click(save())

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while updating quote',
        '',
        'error'
      )
    )
  })

  // COP-7116 (found on dev, Q1004052): the picked products are no registered
  // field, so Save hung on `isValid`. When the tab opens with the quote
  // already loaded, its `reset()` drops react-hook-form 7.91's mount
  // validation and nothing validates again, so `isValid` stayed false and
  // Save disabled after picking.
  it('enables Save after picking a product on a tab opened after the quote loaded', async () => {
    quotesApi.getQuoteById.mockResolvedValue({ ...quote, items: [] })
    pricesApi.matchPrices.mockResolvedValue([
      {
        priceId: 'PR2',
        itemId: { itemType: 'PRODUCT', id: 'P2' },
        originalValue: 99,
        quantity: { quantity: 1, unitCode: 'pcs' },
        tax: { taxClass: 'STANDARD', taxRate: 19 },
      },
    ])
    renderProducts({ openAfterLoad: true })
    const browser = await openPicker()

    checkProduct(browser, 'Table')
    fireEvent.click(apply())

    await waitFor(() =>
      expect((save() as HTMLButtonElement).disabled).toBe(false)
    )
    fireEvent.click(save())
    await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled())
    const [quoteId, operations] = quotesApi.updateQuote.mock.calls[0]
    expect(quoteId).toBe('Q1')
    expect(operations).toHaveLength(1)
    expect(operations[0].op).toBe('ADD')
    expect(operations[0].value[0].product.productId).toBe('P2')
  })

  // COP-7116 (Copilot on #158): match-prices ran before the `try`, so a
  // failed pricing call skipped the error toast.
  it('shows an error toast when pricing the new lines fails', async () => {
    pricesApi.matchPrices.mockRejectedValue(new Error('Network Error'))
    renderProducts()
    const browser = await openPicker()

    checkProduct(browser, 'Table')
    fireEvent.click(apply())
    fireEvent.click(save())

    await waitFor(() =>
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error while updating quote',
        '',
        'error'
      )
    )
    expect(quotesApi.updateQuote).not.toHaveBeenCalled()
  })

  it('removes a dropped line without pricing anything', async () => {
    renderProducts()

    fireEvent.click(await screen.findByTestId('quote-remove-product-P1'))
    expect(screen.getByText('Please add product')).toBeTruthy()
    fireEvent.click(save())

    await waitFor(() =>
      expect(quotesApi.updateQuote).toHaveBeenCalledWith('Q1', [
        { op: 'REMOVE', path: '/items', value: [chairLine] },
      ])
    )
    expect(pricesApi.matchPrices).not.toHaveBeenCalled()
    expect(toast.showToast).toHaveBeenCalledWith('Quote updated', '', 'success')
  })

  it('adds a picked product priced by match-prices', async () => {
    pricesApi.matchPrices.mockResolvedValue([
      {
        priceId: 'PR2',
        itemId: { itemType: 'PRODUCT', id: 'P2' },
        originalValue: 99,
        quantity: { quantity: 1, unitCode: 'pcs' },
        tax: { taxClass: 'STANDARD', taxRate: 19 },
      },
    ])
    renderProducts()
    const browser = await openPicker()

    checkProduct(browser, 'Table')
    fireEvent.click(apply())
    expect(
      within(screen.getByTestId('quote-selected-items')).getByText('Table')
    ).toBeTruthy()
    fireEvent.click(save())

    await waitFor(() =>
      expect(quotesApi.updateQuote).toHaveBeenCalledWith('Q1', [
        {
          op: 'ADD',
          path: '/items',
          value: [
            {
              product: { productId: 'P2', name: { en: 'Table' } },
              quantity: { quantity: 1, unitCode: 'pcs' },
              price: {
                priceId: 'PR2',
                unitPrice: 99,
                newUnitPrice: 99,
                totalNetValue: 99,
                tax: { taxClass: 'STANDARD', taxRate: 19 },
                discount: 0,
              },
            },
          ],
        },
      ])
    )
    expect(pricesApi.matchPrices).toHaveBeenCalledWith({
      targetCurrency: 'EUR',
      siteCode: 'main',
      targetLocation: { countryCode: 'DE' },
      items: [
        {
          itemId: { itemType: 'PRODUCT', id: 'P2' },
          quantity: { quantity: 1 },
        },
      ],
    })
  })

  it('hides the picker without Quotes Manager', async () => {
    permissions.granted = []
    renderProducts()

    await screen.findByTestId('quote-selected-items')
    expect(screen.queryByTestId('quote-select-products')).toBeNull()
    expect(screen.queryByTestId('quote-products-browser')).toBeNull()
    expect(productsApi.syncPaginatedProducts).not.toHaveBeenCalled()
  })

  // COP-7125 (ported from MD quotesNullSafe.test.tsx, emporix/
  // management-dashboard#1707): products without a price and quotes without a
  // shipping address.
  describe('products without a price', () => {
    const noAddress = { ...quote, shippingAddress: null }

    it('marks a saved item without a price as "Price on request"', async () => {
      quotesApi.getQuoteById.mockResolvedValue({
        ...quote,
        items: [
          chairLine,
          {
            itemId: 'I2',
            product: { productId: 'P2', name: { en: 'Table' } },
            quantity: { quantity: 1, unitCode: '' },
            price: null,
          },
        ],
      })
      renderProducts()

      const selected = await screen.findByTestId('quote-selected-items')
      await waitFor(() =>
        expect(within(selected).getAllByText('PRICE ON REQUEST')).toHaveLength(
          1
        )
      )
    })

    it("prices on the quote site's first ship-to country without a shipping address and adds an unmatched product without a price", async () => {
      quotesApi.getQuoteById.mockResolvedValue(noAddress)
      pricesApi.matchPrices.mockResolvedValue([])
      renderProducts()
      const browser = await openPicker()

      checkProduct(browser, 'Table')
      fireEvent.click(apply())
      fireEvent.click(save())

      await waitFor(() =>
        expect(quotesApi.updateQuote).toHaveBeenCalledWith('Q1', [
          {
            op: 'ADD',
            path: '/items',
            value: [
              {
                product: { productId: 'P2', name: { en: 'Table' } },
                quantity: { quantity: 1, unitCode: '' },
              },
            ],
          },
        ])
      )
      expect(pricesApi.matchPrices.mock.calls[0][0].targetLocation).toEqual({
        countryCode: 'AT',
      })
    })

    it('tells the employee to set ship-to countries and sends nothing without one', async () => {
      sites.value = [{ code: 'main', shipToCountries: [] }]
      quotesApi.getQuoteById.mockResolvedValue(noAddress)
      renderProducts()
      const browser = await openPicker()

      checkProduct(browser, 'Table')
      fireEvent.click(apply())
      fireEvent.click(save())

      await waitFor(() =>
        expect(toast.showToast).toHaveBeenCalledWith(
          'No ship-to countries are set for the site of this quote. Set them in the site settings and try again.',
          '',
          'error'
        )
      )
      expect(pricesApi.matchPrices).not.toHaveBeenCalled()
      expect(quotesApi.updateQuote).not.toHaveBeenCalled()
      sites.value = [{ code: 'main', shipToCountries: ['AT'] }]
    })
  })

  // COP-7125: the other cases of MD quotesNullSafe.test.tsx (emporix/
  // management-dashboard#1707) for this tab, with MD's titles. The remote's
  // error toasts carry the API message as the title (COP-7116).
  describe('MD quotesNullSafe cases', () => {
    const noAddress = { ...quote, shippingAddress: null }
    const addTable = async () => {
      const browser = await openPicker()
      checkProduct(browser, 'Table')
      fireEvent.click(apply())
      fireEvent.click(save())
    }

    it('products tab keeps the original layout for fully priced quotes', async () => {
      renderProducts()

      const selected = await screen.findByTestId('quote-selected-items')
      await within(selected).findByText('Chair')
      expect(within(selected).queryByText('PRICE ON REQUEST')).toBeNull()
      // Name, id and remove: no badge column.
      expect(selected.firstElementChild?.children).toHaveLength(3)
    })

    it('products tab marks unpriced products as price on request', async () => {
      // One item with `price: null`, one without a `price` key.
      quotesApi.getQuoteById.mockResolvedValue(unpricedQuote())
      renderProducts()

      const selected = await screen.findByTestId('quote-selected-items')
      expect(await within(selected).findByText('Unpriced product')).toBeTruthy()
      await waitFor(() =>
        expect(within(selected).getAllByText('PRICE ON REQUEST')).toHaveLength(
          2
        )
      )
      expect(document.body.textContent).not.toMatch(/NaN|undefined|null/)
    })

    describe('products tab price matching without a shipping address', () => {
      it('toasts the backend message when price matching fails', async () => {
        quotesApi.getQuoteById.mockResolvedValue(noAddress)
        pricesApi.matchPrices.mockRejectedValue({
          response: { data: { message: 'Bad country' } },
        })
        renderProducts()

        await addTable()

        await waitFor(() =>
          expect(toast.showToast).toHaveBeenCalledWith(
            'Bad country',
            '',
            'error'
          )
        )
        expect(quotesApi.updateQuote).not.toHaveBeenCalled()
      })

      it('toasts the backend message when the quote update fails', async () => {
        quotesApi.getQuoteById.mockResolvedValue(noAddress)
        pricesApi.matchPrices.mockResolvedValue([])
        quotesApi.updateQuote.mockRejectedValue({
          response: { data: { message: 'Update refused' } },
        })
        renderProducts()

        await addTable()

        await waitFor(() =>
          expect(toast.showToast).toHaveBeenCalledWith(
            'Update refused',
            '',
            'error'
          )
        )
      })
    })

    describe('products tab: priced products on a quote without a shipping address', () => {
      const match = (tax?: { taxClass: string; taxRate: number }) => [
        {
          priceId: 'PR2',
          itemId: { itemType: 'PRODUCT', id: 'P2' },
          originalValue: 12,
          quantity: { unitCode: 'pcs' },
          ...(tax ? { tax } : {}),
        },
      ]
      const addTableAndLamp = async () => {
        productsApi.syncPaginatedProducts.mockResolvedValue({
          data: [
            { id: 'P1', code: 'CH', name: { en: 'Chair' } },
            { id: 'P2', code: 'TB', name: { en: 'Table' } },
            { id: 'P3', code: 'LA', name: { en: 'Lamp' } },
          ],
          totalCount: 3,
        })
        quotesApi.getQuoteById.mockResolvedValue(noAddress)
        renderProducts()
        const browser = await openPicker()
        checkProduct(browser, 'Table')
        checkProduct(browser, 'Lamp')
        fireEvent.click(apply())
        fireEvent.click(save())
        await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled())
        const [quoteId, operations] = quotesApi.updateQuote.mock.calls[0]
        return { quoteId, operations }
      }
      type AddedItem = {
        product: { productId: string }
        quantity: unknown
        price?: Record<string, unknown>
      }
      const added = (operations: { value: AddedItem[] }[], id: string) =>
        operations[0].value.find(
          (item) => item.product.productId === id
        ) as AddedItem

      it('sends the tax class without the rate, and the unmatched item without a price', async () => {
        pricesApi.matchPrices.mockResolvedValue(
          match({ taxClass: 'STD', taxRate: 19 })
        )

        const { quoteId, operations } = await addTableAndLamp()

        expect(quoteId).toBe('Q1')
        expect(operations).toHaveLength(1)
        expect(operations[0].op).toBe('ADD')
        expect(operations[0].path).toBe('/items')
        const table = added(operations, 'P2')
        expect(table.price).toEqual({
          priceId: 'PR2',
          unitPrice: 12,
          newUnitPrice: 12,
          totalNetValue: 12,
          tax: { taxClass: 'STD' },
          discount: 0,
        })
        expect(table.quantity).toEqual({ quantity: 1, unitCode: 'pcs' })
        const lamp = added(operations, 'P3')
        expect('price' in lamp).toBe(false)
        // The quote service requires quantity.unitCode (not null).
        expect(lamp.quantity).toEqual({ quantity: 1, unitCode: '' })
      })

      it('without tax in the match no tax is sent and the backend message is shown', async () => {
        pricesApi.matchPrices.mockResolvedValue(match())
        quotesApi.updateQuote.mockRejectedValue({
          response: { data: { message: 'Tax is required' } },
        })

        const { operations } = await addTableAndLamp()

        expect('tax' in (added(operations, 'P2').price ?? {})).toBe(false)
        await waitFor(() =>
          expect(toast.showToast).toHaveBeenCalledWith(
            'Tax is required',
            '',
            'error'
          )
        )
      })
    })
  })
})
