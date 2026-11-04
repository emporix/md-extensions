/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductRow } from '@emporix/api-calls'
import { EmployeeDomains } from '../configs/accessControls'
import type { CategoryTree } from '../models/Category.model'
import type Localized from '../models/Localized.model'
import ProductsListPage from './ProductsList.page'

const mocks = vi.hoisted(() => ({
  syncPaginatedProductsRows: vi.fn(),
  fetchAllProducts: vi.fn(),
  saveToCsvFile: vi.fn(),
  getCategoryTrees: vi.fn(),
  navigate: vi.fn(),
  getTableMixinColumns: () => [],
  permissions: new Set<string>(),
  tableConfigurations: [] as unknown[],
  isConfigurationLoaded: true,
  tenant: 'tenant-1',
}))

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  useToast: () => ({ showToast: vi.fn(), showError: vi.fn() }),
}))
// The page imports helpers that load `translations/i18n`, which needs the real
// `initReactI18next`.
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('../hooks/api/products', () => ({
  useProductsApi: () => ({
    syncPaginatedProductsRows: mocks.syncPaginatedProductsRows,
    fetchAllProducts: mocks.fetchAllProducts,
    deleteProduct: vi.fn(),
    triggerDynamicVariantRecalculation: vi.fn(),
  }),
}))
vi.mock('../hooks/api/categoryTree', () => ({
  useCategoryTreeApi: () => ({ getCategoryTrees: mocks.getCategoryTrees }),
}))
vi.mock('../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value: Localized | string | undefined) =>
      typeof value === 'string' ? value : (value?.en ?? ''),
    getUiLangValue: (value: Localized | string | undefined) =>
      typeof value === 'string' ? value : (value?.en ?? ''),
  }),
}))
vi.mock('../hooks/useCustomNavigate', () => ({
  default: () => ({ navigate: mocks.navigate }),
}))
vi.mock('../context/UIBlocker', () => ({
  useUIBlocker: () => ({ blockPanel: vi.fn() }),
}))
vi.mock('../context/FeatureTogglesProvider', () => ({
  useFeatureToggles: () => ({ isToggleValid: () => false }),
}))
vi.mock('../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => mocks.permissions.has(domain),
  }),
}))
vi.mock('../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    tableConfigurations: mocks.tableConfigurations,
    getTableMixinColumns: mocks.getTableMixinColumns,
    isConfigurationLoaded: mocks.isConfigurationLoaded,
  }),
}))
vi.mock('../helpers/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../helpers/download')>()),
  saveToCsvFile: mocks.saveToCsvFile,
}))
vi.mock('../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: mocks.tenant, contentLanguage: 'en' }),
}))
vi.mock('../components/shared/HeaderSection', () => ({
  default: () => null,
}))
vi.mock('../components/shared/TableActions', () => ({ default: () => null }))
vi.mock('../components/shared/TableExtensions', () => ({
  default: () => null,
}))
vi.mock('../components/shared/BatchDeleteButton', () => ({
  default: () => null,
}))
vi.mock('../components/products/CreateProductDialog', () => ({
  default: () => null,
}))

// PrimeReact's DataTable observes its size; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const shoe = {
  id: 'shoe-1',
  imageUrl: null,
  name: 'Running shoe',
  code: 'SHOE-1',
  productType: 'BASIC',
  ref: { id: 'shoe-1', localizedName: { en: 'Running shoe' } },
  price: '€10.00',
  mixins: {},
  vendorName: '',
} as ProductRow

const category = (id: string, name: string): CategoryTree => ({
  id,
  position: 1,
  published: true,
  localizedName: { en: name },
})

const pageAt = (url = '/') => (
  <MemoryRouter initialEntries={[url]}>
    <ProductsListPage />
  </MemoryRouter>
)

const renderPage = async (url = '/') => {
  const result = render(pageAt(url))
  await screen.findByText('Running shoe')
  return result
}

const lastLoad = () => mocks.syncPaginatedProductsRows.mock.lastCall ?? []

const hiddenPrice = {
  key: 'ext_products',
  columns: [{ key: 'price', label: 'Price', visible: false }],
  mixins: [],
}

beforeEach(() => {
  mocks.permissions.clear()
  mocks.tableConfigurations = []
  mocks.isConfigurationLoaded = true
  mocks.tenant = 'tenant-1'
  mocks.syncPaginatedProductsRows.mockResolvedValue({
    data: [shoe],
    totalCount: 1,
  })
  mocks.getCategoryTrees.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProductsListPage', () => {
  it('waits for the saved settings before the first load', async () => {
    mocks.isConfigurationLoaded = false
    const { rerender } = render(pageAt())
    expect(mocks.syncPaginatedProductsRows).not.toHaveBeenCalled()

    mocks.isConfigurationLoaded = true
    mocks.tableConfigurations = [hiddenPrice]
    rerender(pageAt())

    await screen.findByText('Running shoe')
    expect(mocks.syncPaginatedProductsRows).toHaveBeenCalledTimes(1)
    expect(lastLoad()[2]).toBe(false)
  })

  it('starts a new tenant on the first page once its settings arrive', async () => {
    const { rerender } = await renderPage('/?page=2&rows=25')
    expect(lastLoad()[0]).toEqual(expect.objectContaining({ currentPage: 2 }))

    mocks.tenant = 'tenant-2'
    mocks.isConfigurationLoaded = false
    rerender(pageAt())
    expect(screen.queryByText('Running shoe')).toBeNull()

    mocks.syncPaginatedProductsRows.mockClear()
    mocks.isConfigurationLoaded = true
    rerender(pageAt())

    await screen.findByText('Running shoe')
    expect(mocks.syncPaginatedProductsRows).toHaveBeenCalledTimes(1)
    expect(lastLoad()[0]).toEqual(expect.objectContaining({ currentPage: 1 }))
  })

  it('exports the products of the current scope to CSV', async () => {
    mocks.fetchAllProducts.mockResolvedValue([shoe])
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'global.download' }))

    await waitFor(() => expect(mocks.saveToCsvFile).toHaveBeenCalledTimes(1))
    expect(mocks.fetchAllProducts).toHaveBeenCalledWith(
      expect.objectContaining({ currentPage: 1, rows: 100 })
    )
    const [filename, data] = mocks.saveToCsvFile.mock.calls[0]
    expect(filename).toMatch(/^products-.+\.csv$/)
    expect(data).toContain('shoe-1')
    expect(data).toContain('Running shoe')
  })

  it('lists the products with their prices', async () => {
    await renderPage()

    const [pagination, withTotalCount, withPrices] = lastLoad()
    expect(pagination).toEqual(expect.objectContaining({ currentPage: 1 }))
    expect(withTotalCount).toBe(true)
    expect(withPrices).toBe(true)
    expect(screen.getByText('products.table.price')).not.toBeNull()
  })

  it('loads no prices when the saved settings hide the price column', async () => {
    mocks.tableConfigurations = [hiddenPrice]
    await renderPage()

    expect(lastLoad()[2]).toBe(false)
    expect(screen.queryByText('products.table.price')).toBeNull()
  })

  it('opens a product on a row click', async () => {
    await renderPage()

    fireEvent.click(screen.getByText('Running shoe'))

    expect(mocks.navigate).toHaveBeenCalledWith('/shoe-1')
  })

  it('starts on the page the URL holds', async () => {
    await renderPage('/?page=2&rows=25')

    expect(mocks.syncPaginatedProductsRows.mock.calls[0][0]).toEqual(
      expect.objectContaining({ currentPage: 2, rows: 25 })
    )
  })

  it('loads the products of the whole branch of a selected category', async () => {
    mocks.permissions.add(EmployeeDomains.CATEGORIES_VIEWER)
    mocks.getCategoryTrees.mockResolvedValue([
      {
        ...category('footwear', 'Footwear'),
        subcategories: [category('boots', 'Boots')],
      },
    ])
    await renderPage()

    fireEvent.click(
      screen.getByRole('button', { name: 'products.browser.treeView' })
    )
    fireEvent.click(await screen.findByText('Footwear'))

    await waitFor(() =>
      expect(lastLoad()[0]).toEqual(
        expect.objectContaining({
          filters: expect.objectContaining({
            categoryIds: { value: ['footwear', 'boots'], matchMode: 'in' },
          }),
        })
      )
    )
  })

  it('offers no tree view without access to categories', async () => {
    await renderPage()

    expect(
      screen.queryByRole('button', { name: 'products.browser.treeView' })
    ).toBeNull()
    expect(mocks.getCategoryTrees).not.toHaveBeenCalled()
  })
})
