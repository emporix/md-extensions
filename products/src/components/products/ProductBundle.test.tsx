/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BundledProduct, Product } from '../../models/Category.model'
import type Localized from '../../models/Localized.model'
import ProductBundle from './ProductBundle'

const mocks = vi.hoisted(() => ({
  getAllProducts: vi.fn(),
  patchProduct: vi.fn(),
}))

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))
vi.mock('../../hooks/api/products', () => ({
  useProductsApi: () => ({
    getAllProducts: mocks.getAllProducts,
    patchProduct: mocks.patchProduct,
  }),
}))
vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value: Localized | undefined) => value?.en ?? '',
  }),
}))
vi.mock('../../context/ProductDataProvider', () => ({
  useProductData: () => ({ refreshData: vi.fn() }),
}))
vi.mock('../../context/UIBlocker', () => ({
  useUIBlocker: () => ({ blockPanel: vi.fn() }),
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))
vi.mock('./AddProductsDialog', () => ({ default: () => null }))

const ids = ['p-1', 'p-2', 'p-3']
const bundled: BundledProduct[] = ids.map((productId) => ({
  productId,
  amount: 1,
}))
const products = ids.map(
  (id) => ({ id, name: { en: `Name ${id}` }, media: [] }) as unknown as Product
)

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

afterEach(() => {
  cleanup()
  mocks.getAllProducts.mockReset()
})

describe('ProductBundle', () => {
  it('lists the bundled items once the products are loaded', async () => {
    mocks.getAllProducts.mockResolvedValue(products)
    render(<ProductBundle bundledItems={bundled} editedId="bundle" />)
    expect(await screen.findByText('Name p-1')).toBeTruthy()
    expect(screen.getByText('p-3')).toBeTruthy()
  })

  // DCPS-19599: the table showed "No data found" for a filled bundle.
  it('shows the bundled items while their products are still loading', async () => {
    const request = deferred<Product[]>()
    mocks.getAllProducts.mockReturnValue(request.promise)
    render(<ProductBundle bundledItems={bundled} editedId="bundle" />)

    ids.forEach((id) => expect(screen.getByText(id)).toBeTruthy())
    expect(screen.queryByText('Name p-1')).toBeNull()

    await act(async () => request.resolve(products))
    expect(screen.getByText('Name p-1')).toBeTruthy()
  })

  it('keeps the bundled items when loading their products fails', async () => {
    mocks.getAllProducts.mockRejectedValue(new Error('network'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ProductBundle bundledItems={bundled} editedId="bundle" />)

    await act(async () => undefined)
    ids.forEach((id) => expect(screen.getByText(id)).toBeTruthy())
  })

  it('shows the current bundle when an older request resolves last', async () => {
    const first = deferred<Product[]>()
    const second = deferred<Product[]>()
    mocks.getAllProducts
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { rerender } = render(
      <ProductBundle bundledItems={bundled} editedId="bundle" />
    )
    const updated = [...bundled, { productId: 'p-4', amount: 2 }]
    rerender(<ProductBundle bundledItems={updated} editedId="bundle" />)

    await act(async () =>
      second.resolve([
        { id: 'p-4', name: { en: 'Name p-4' } } as unknown as Product,
      ])
    )
    await act(async () => first.resolve(products))

    expect(mocks.getAllProducts).toHaveBeenCalledTimes(2)
    ;[...ids, 'p-4'].forEach((id) =>
      expect(screen.getByText(`Name ${id}`)).toBeTruthy()
    )
  })
})
