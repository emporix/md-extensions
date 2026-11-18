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

const renderProducts = () =>
  render(
    <DashboardProvider appState={appState}>
      <MemoryRouter initialEntries={['/Q1']}>
        <Routes>
          <Route
            path="/:quoteId"
            element={
              <QuoteDataProvider>
                <QuotesTabProducts />
              </QuoteDataProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    </DashboardProvider>
  )

const save = () => screen.getByRole('button', { name: 'Save' })

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

  it('lists the quote lines and the products picker', async () => {
    renderProducts()

    const selected = await screen.findByTestId('quote-selected-items')
    expect(within(selected).getByText('Chair')).toBeTruthy()
    expect(within(selected).getByText('P1')).toBeTruthy()
    await waitFor(() =>
      expect(
        within(screen.getByTestId('quote-products-browser')).getByText('Table')
      ).toBeTruthy()
    )
    expect(productsApi.syncPaginatedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ currentPage: 1, rows: 10 })
    )
    // Without Categories Viewer the tree is never requested.
    expect(categoriesApi.getCategoryTrees).not.toHaveBeenCalled()
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

  // COP-7116 (Copilot on #158): match-prices ran before the `try`, so a
  // failed pricing call skipped the error toast.
  it('shows an error toast when pricing the new lines fails', async () => {
    pricesApi.matchPrices.mockRejectedValue(new Error('Network Error'))
    renderProducts()
    const browser = await screen.findByTestId('quote-products-browser')
    await waitFor(() => expect(within(browser).getByText('Table')).toBeTruthy())

    const tableRow = within(browser)
      .getByText('Table')
      .closest('tr') as HTMLElement
    fireEvent.click(tableRow.querySelector('.p-checkbox-box') as HTMLElement)
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
    const browser = await screen.findByTestId('quote-products-browser')
    await waitFor(() => expect(within(browser).getByText('Table')).toBeTruthy())

    const tableRow = within(browser)
      .getByText('Table')
      .closest('tr') as HTMLElement
    fireEvent.click(tableRow.querySelector('.p-checkbox-box') as HTMLElement)
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
    expect(screen.queryByTestId('quote-products-browser')).toBeNull()
    expect(productsApi.syncPaginatedProducts).not.toHaveBeenCalled()
  })
})
