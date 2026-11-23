/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '../../translations/i18n'
import { ProductDetailsForm } from './ProductDetailsForm'
import { Product, ProductType } from '../../models/Category.model'

const vendor1 = { id: 'v1', name: 'Vendor 1' }
const vendor2 = { id: 'v2', name: 'Vendor 2' }

const product = {
  id: 'p1',
  code: 'CHAIR-1',
  name: { en: 'Chair' },
  description: { en: 'A chair' },
  productType: ProductType.basic,
  published: false,
  vendor: vendor1,
  mixins: {},
  metadata: { mixins: {}, version: 3 },
} as unknown as Product

const updateProduct = vi.fn(async () => undefined)
const refreshData = vi.fn(async () => undefined)

// Hook results are module-level constants: the form re-initialises when they
// change identity, as it does in the app when the provider values change.
const productData: {
  product: Product
  parentProduct: Product | undefined
  refreshData: typeof refreshData
} = { product, parentProduct: undefined, refreshData }
const activeNode = {
  activeNodeState: {},
  setActiveNodeState: vi.fn(),
  overriddenFields: new Set<string>(),
  markOverridden: vi.fn(),
  removeOverridden: vi.fn(),
  clearOverridden: vi.fn(),
  inheritedValues: {},
  setInheritedValues: vi.fn(),
  isAddFlow: false,
}
const productsApi = {
  createProduct: vi.fn(),
  updateProduct,
  getOwnOverriddenPaths: vi.fn(),
}
const vendorsApi = {
  getVendors: async () => ({ values: [vendor1, vendor2] }),
}
const configurationApi = { getSingleConfiguration: async () => undefined }
const searchParams = [new URLSearchParams()]
const uiBlocker = { blockPanel: vi.fn() }
const customNavigate = { navigate: vi.fn() }
const toggles = { isToggleValid: () => false }
const permissions = { hasPermission: () => true }
const toast = { showToast: vi.fn(), showError: vi.fn() }

vi.mock('../../context/ProductDataProvider', () => ({
  useProductData: () => productData,
}))
vi.mock('../../context/ActiveNodeProvider', () => ({
  useActiveNode: () => activeNode,
}))
vi.mock('../../hooks/api/products', () => ({
  useProductsApi: () => productsApi,
}))
vi.mock('../../hooks/api/vendors', () => ({
  useVendorsApi: () => vendorsApi,
}))
vi.mock('../../hooks/api/configuration', () => ({
  useConfigurationApi: () => configurationApi,
}))
vi.mock('react-router', () => ({
  useParams: () => ({ id: 'p1' }),
  useSearchParams: () => searchParams,
}))
vi.mock('../../context/UIBlocker', () => ({
  useUIBlocker: () => uiBlocker,
}))
vi.mock('../../hooks/useCustomNavigate', () => ({
  default: () => customNavigate,
}))
vi.mock('../../context/FeatureTogglesProvider', () => ({
  useFeatureToggles: () => toggles,
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => permissions,
}))
vi.mock('@emporix/api-calls', async () => {
  const actual =
    await vi.importActual<typeof import('@emporix/api-calls')>(
      '@emporix/api-calls'
    )
  return {
    ...actual,
    fetchBrands: async () => ({ values: [] }),
    fetchLabels: async () => ({ values: [] }),
  }
})
vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return { ...actual, useToast: () => toast }
})
vi.mock('./ProductAttributes', () => ({ ProductAttributes: () => null }))
vi.mock('./AssistantBox', () => ({ default: () => null }))

const saveButton = () => screen.getByRole('button', { name: 'Save' })

const vendorInput = () =>
  screen.getByRole('combobox', { name: 'Vendor' }) as HTMLInputElement

const publishedSwitch = () => {
  const label = screen.getByText('Published', { selector: 'label' })
  const field = label.parentElement?.parentElement as HTMLElement
  return within(field).getByRole('switch')
}

const pickVendor = async (name: string) => {
  const inputWrap = vendorInput().parentElement as HTMLElement
  fireEvent.click(
    within(inputWrap).getByRole('button', { name: 'Show suggestions' })
  )
  fireEvent.mouseDown(await screen.findByRole('option', { name }))
}

const renderOpenedProduct = async () => {
  render(<ProductDetailsForm />)
  await waitFor(() => expect(vendorInput().value).toBe('Vendor 1'))
}

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  productData.product = product
})

describe('ProductDetailsForm Save button', () => {
  it('stays inactive on an opened product until something changes', async () => {
    await renderOpenedProduct()

    expect(saveButton()).toHaveProperty('disabled', true)
  })

  it('becomes active when another vendor is picked as the only edit and saves it', async () => {
    await renderOpenedProduct()

    await pickVendor('Vendor 2')

    expect(vendorInput().value).toBe('Vendor 2')
    await waitFor(() => expect(saveButton()).toHaveProperty('disabled', false))
    fireEvent.click(saveButton())
    await waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1))
    expect(updateProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', vendor: vendor2 })
    )
  })

  it('becomes active when Published is toggled as the only edit', async () => {
    await renderOpenedProduct()

    fireEvent.click(publishedSwitch())

    await waitFor(() => expect(saveButton()).toHaveProperty('disabled', false))
  })

  it('keeps an unsaved vendor and stays active when the same product reloads', async () => {
    const { rerender } = render(<ProductDetailsForm />)
    await waitFor(() => expect(vendorInput().value).toBe('Vendor 1'))
    await pickVendor('Vendor 2')
    await waitFor(() => expect(saveButton()).toHaveProperty('disabled', false))

    productData.product = { ...product }
    rerender(<ProductDetailsForm />)

    await waitFor(() => expect(vendorInput().value).toBe('Vendor 2'))
    expect(saveButton()).toHaveProperty('disabled', false)
  })

  it('restores the loaded vendor and turns inactive again on Discard', async () => {
    await renderOpenedProduct()
    await pickVendor('Vendor 2')
    expect(vendorInput().value).toBe('Vendor 2')

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(vendorInput().value).toBe('Vendor 1'))
    expect(saveButton()).toHaveProperty('disabled', true)
  })
})
