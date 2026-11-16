/** @vitest-environment jsdom */
import { useEffect } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductAttributes } from './ProductAttributes'
import {
  Product,
  ProductTemplate,
  ProductType,
} from '../../models/Category.model'

const fetchProductTemplate = vi.fn()

vi.mock('../../hooks/api/products', () => ({
  useProductsApi: () => ({
    fetchProductTemplate,
    fetchProductTemplates: async () => ({ values: [] }),
  }),
}))
vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))
vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({ getContentLangValue: () => 'Template' }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('react-router', () => ({ useParams: () => ({}) }))
vi.mock('./dynamicVariants/DynamicVariantAttributes', () => ({
  default: () => null,
}))

const template = {
  id: 'tpl',
  name: { en: 'Template' },
  metadata: { version: 1 },
  attributes: [
    {
      key: 'color',
      metadata: { variantAttribute: true, mandatory: false },
      values: [{ key: 'red' }, { key: 'blue' }],
    },
  ],
} as unknown as ProductTemplate

const parent = {
  id: 'parent',
  productType: ProductType.parentVariant,
  template: { id: 'tpl', version: 1 },
  variantAttributes: { color: [{ key: 'red' }, { key: 'blue' }] },
} as unknown as Product

// A variant read from Product Service carries no `variantAttributes`.
const variant = {
  id: 'parent--red',
  productType: ProductType.variant,
  template: { id: 'tpl', version: 1 },
} as unknown as Product

let form: UseFormReturn<Product> | undefined

/** Mirrors ProductDetailsForm: one form, reset whenever the product changes. */
const Harness = ({ product }: { product: Product }) => {
  const methods = useForm<Product>({ defaultValues: product })
  form = methods
  useEffect(() => {
    methods.reset(product)
  }, [product, methods])
  return (
    <FormProvider {...methods}>
      <ProductAttributes product={product} />
    </FormProvider>
  )
}

afterEach(() => {
  cleanup()
  fetchProductTemplate.mockReset()
  form = undefined
})

describe('ProductAttributes template version effect', () => {
  it('ignores a late template answer for the parent once the variant is shown (Scenario 2)', async () => {
    let answerParent: (value: ProductTemplate) => void = () => undefined
    let versionedCalls = 0
    fetchProductTemplate.mockImplementation((_id: string, version?: number) => {
      if (version === undefined) {
        return Promise.resolve(template)
      }
      versionedCalls += 1
      if (versionedCalls === 1) {
        return new Promise<ProductTemplate>((resolve) => {
          answerParent = resolve
        })
      }
      return Promise.resolve(template)
    })

    const { rerender } = render(<Harness product={parent} />)
    await act(async () => {
      rerender(<Harness product={variant} />)
    })
    await act(async () => {
      answerParent(template)
    })

    expect(versionedCalls).toBe(2)
    expect(form?.getValues('id')).toBe('parent--red')
    expect(form?.getValues('variantAttributes')).toBeUndefined()
    expect(form?.formState.dirtyFields).toEqual({})
  })
})
