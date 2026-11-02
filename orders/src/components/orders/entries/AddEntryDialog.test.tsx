/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoryTree } from '@emporix/api-calls'
import { EmployeeDomains } from '../../../configs/accessControls'
import type Localized from '../../../models/Localized.model'
import { ProductType } from '../../../models/Order.model'
import type { Product } from '../../../models/Product.model'
import AddEntryDialog from './AddEntryDialog'

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  getContentLangValue: (value: Localized | string | undefined) =>
    typeof value === 'string' ? value : (value?.en ?? '--'),
  showError: vi.fn(),
  syncPaginatedProducts: vi.fn(),
  getCategoryTrees: vi.fn(),
  addEntries: vi.fn(),
  addNewEntriesFromProducts: vi.fn(),
  updateOrder: vi.fn(),
  permissions: new Set<string>(),
}))

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  useToast: () => ({ showError: mocks.showError }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t }),
}))
vi.mock('../../../hooks/api/products', () => ({
  useProductsApi: () => ({
    syncPaginatedProducts: mocks.syncPaginatedProducts,
  }),
}))
vi.mock('../../../hooks/api/categories', () => ({
  useCategoriesApi: () => ({ getCategoryTrees: mocks.getCategoryTrees }),
}))
vi.mock('../../../hooks/api/orders', () => ({
  useOrdersApi: () => ({ addEntries: mocks.addEntries }),
}))
vi.mock('../../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: mocks.getContentLangValue,
    contentLanguage: 'en',
  }),
}))
vi.mock('../../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: 'tenant-1' }),
}))
vi.mock('../../../context/PermissionsProvider', () => ({
  usePermissions: () => ({
    hasPermission: (domain: string) => mocks.permissions.has(domain),
  }),
}))
vi.mock('../../../contexts/OrderData.provider', () => ({
  useOrderData: () => ({
    order: { id: 'order-1' },
    newEntries: [],
    updateOrder: mocks.updateOrder,
  }),
}))
vi.mock('../../../helpers/orders', () => ({
  addNewEntriesFromProducts: mocks.addNewEntriesFromProducts,
}))

// PrimeReact's DataTable observes its size; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const shoe: Product = {
  id: 'shoe-1',
  code: 'SHOE-1',
  name: { en: 'Running shoe' },
  productType: ProductType.basic,
  media: [],
}

const category = (
  id: string,
  name: string,
  published: boolean
): CategoryTree => ({
  id,
  position: 1,
  published,
  localizedName: { en: name },
})

const SUBMIT = 'orders.entry.actions.addProduct.dialog.title'
const TREE_VIEW = 'orders.entry.actions.addProduct.browser.treeView'

const increaseButton = () =>
  screen.getByRole('button', { name: 'Increase quantity' }) as HTMLButtonElement

const errorTitles = () => mocks.showError.mock.calls.map(([title]) => title)

const renderDialog = async () => {
  const onClose = vi.fn()
  render(<AddEntryDialog visible onClose={onClose} />)
  await screen.findByText('Running shoe')
  return onClose
}

const pickShoeAndSave = () => {
  fireEvent.click(increaseButton())
  fireEvent.click(screen.getByRole('button', { name: SUBMIT }))
}

const clickMask = () => {
  const mask = document.querySelector('.p-dialog-mask')
  expect(mask).not.toBeNull()
  fireEvent.click(mask as Element)
}

beforeEach(() => {
  mocks.permissions.clear()
  mocks.permissions.add(EmployeeDomains.CATEGORIES_VIEWER)
  mocks.syncPaginatedProducts.mockResolvedValue({
    data: [shoe],
    totalCount: 1,
  })
  mocks.getCategoryTrees.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AddEntryDialog', () => {
  it('adds the picked products to the order and closes', async () => {
    const savedOrder = { id: 'order-1', entries: [] }
    mocks.addNewEntriesFromProducts.mockResolvedValue(savedOrder)
    const onClose = await renderDialog()

    pickShoeAndSave()

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(mocks.addNewEntriesFromProducts).toHaveBeenCalledWith(
      'order-1',
      [],
      [expect.objectContaining({ id: 'shoe-1', quantity: 1 })],
      mocks.addEntries
    )
    expect(mocks.updateOrder).toHaveBeenCalledWith(savedOrder)
  })

  it('closes on a click outside the dialog', async () => {
    const onClose = await renderDialog()

    clickMask()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks the picks and cannot be closed while saving', async () => {
    let finishSave: (order: unknown) => void = () => undefined
    mocks.addNewEntriesFromProducts.mockReturnValue(
      new Promise((resolve) => {
        finishSave = resolve
      })
    )
    const onClose = await renderDialog()

    pickShoeAndSave()

    await waitFor(() => expect(increaseButton().disabled).toBe(true))
    expect(screen.queryByRole('button', { name: 'global.remove' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    clickMask()
    expect(onClose).not.toHaveBeenCalled()

    finishSave({ id: 'order-1' })

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not save twice when the button is clicked again during the save', async () => {
    mocks.addNewEntriesFromProducts.mockReturnValue(new Promise(() => {}))
    await renderDialog()

    pickShoeAndSave()
    const submit = screen.getByRole('button', {
      name: SUBMIT,
    }) as HTMLButtonElement
    fireEvent.click(submit)

    expect(submit.disabled).toBe(true)
    expect(mocks.addNewEntriesFromProducts).toHaveBeenCalledTimes(1)
  })

  it('keeps the picks for another try when saving fails', async () => {
    mocks.addNewEntriesFromProducts.mockRejectedValue(new Error('Conflict'))
    const onClose = await renderDialog()

    pickShoeAndSave()

    await waitFor(() =>
      expect(errorTitles()).toContain('orders.toasts.errorEntriesUpdate')
    )
    await waitFor(() => expect(increaseButton().disabled).toBe(false))
    expect(screen.getByText('1x Running shoe')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'global.remove' })).not.toBeNull()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the categories with a status dot in the tree view', async () => {
    mocks.getCategoryTrees.mockResolvedValue([
      category('shoes', 'Shoes', true),
      category('archive', 'Archive', false),
    ])
    await renderDialog()

    fireEvent.click(screen.getByRole('button', { name: TREE_VIEW }))

    expect(await screen.findByText('Shoes')).not.toBeNull()
    expect(screen.getByText('Archive')).not.toBeNull()
    expect(screen.getAllByTestId('dot-indicator')).toHaveLength(2)
  })

  it('does not request the tree without access to categories', async () => {
    mocks.permissions.clear()
    await renderDialog()

    fireEvent.click(screen.getByRole('button', { name: TREE_VIEW }))

    expect(await screen.findByText('global.noPermissions')).not.toBeNull()
    expect(mocks.getCategoryTrees).not.toHaveBeenCalled()
  })

  it('reports a failed tree as a categories error', async () => {
    mocks.getCategoryTrees.mockRejectedValue(new Error('Forbidden'))
    await renderDialog()

    fireEvent.click(screen.getByRole('button', { name: TREE_VIEW }))

    await waitFor(() =>
      expect(errorTitles()).toContain('orders.toasts.errorFetchCategories')
    )
    expect(errorTitles()).not.toContain('orders.toasts.errorFetchProducts')
  })
})
