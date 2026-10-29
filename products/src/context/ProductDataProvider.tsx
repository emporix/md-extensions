import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Props } from '../helpers/props'
import { Product, ProductTemplate, ProductType } from '../models/Category.model'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useParams, useSearchParams } from 'react-router'
import { useProductsApi } from '../hooks/api/products'
import Localized from '../models/Localized.model'
import { useToast } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import {
  buildDynamicVariantChildDraft,
  buildDynamicVariantSiblingDraft,
} from '../helpers/dynamicVariantChildDraft'

const PRODUCT_TYPE_PARAM_NAME = 'type'
const PRODUCT_SUBSCRIPTION_PARAM_NAME = 'subscription'
const PRODUCT_PARENT_VARIANT_PARAM_NAME = 'parentVariantId'
const PRODUCT_SIBLING_PARAM_NAME = 'siblingId'

interface ProductData {
  product: Partial<Product>
  parentProduct: Partial<Product> | undefined
  productTemplate: ProductTemplate
  refreshData: () => Promise<void>
}

const ProductDataContext = createContext<ProductData>({
  product: {} as Partial<Product>,
  parentProduct: {} as Partial<Product>,
  productTemplate: { attributes: [], name: {} as Localized },
  refreshData: async () => {
    //NOOP
  },
})

// eslint-disable-next-line react-refresh/only-export-components -- MD API: hook beside its provider
export const useProductData = () => useContext(ProductDataContext)

export const ProductDataProvider: FC<Props> = ({ children }) => {
  const [searchParams] = useSearchParams()
  const productTypeParam = searchParams.get(PRODUCT_TYPE_PARAM_NAME)
  const subscriptionParam = searchParams.get(PRODUCT_SUBSCRIPTION_PARAM_NAME)
  const parentVariantIdParam = searchParams.get(
    PRODUCT_PARENT_VARIANT_PARAM_NAME
  )
  const siblingIdParam = searchParams.get(PRODUCT_SIBLING_PARAM_NAME)
  const { getProduct } = useProductsApi()
  const { createEmptyLocalized } = useLocalizedValue()
  const toast = useToast()
  const { t } = useTranslation()
  const { id } = useParams()

  const getProductType = useCallback(() => {
    const urlType = productTypeParam
    const typesValues: string[] = Object.values(ProductType)
    return urlType && typesValues.includes(urlType)
      ? (urlType as ProductType)
      : ProductType.basic
  }, [productTypeParam])

  const defaultProduct = useMemo<Partial<Product>>(() => {
    const base: Partial<Product> = {
      name: createEmptyLocalized(),
      published: false,
      productType: getProductType(),
      media: [],
    }
    if (getProductType() === ProductType.dynamicVariant) {
      base.ownVariantAttributes = {}
      base.sellable = false
    }
    return base
  }, [getProductType, createEmptyLocalized])

  useEffect(() => {
    void refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: reload on route/query change only
  }, [
    id,
    subscriptionParam,
    parentVariantIdParam,
    siblingIdParam,
    productTypeParam,
  ])

  const refreshData = useCallback(async () => {
    if (id) {
      const productData: Product = await getProduct(id)
      if (productData.parentVariantId) {
        try {
          const parentData = await getProduct(productData.parentVariantId)
          if (parentData.productType === ProductType.parentVariant) {
            productData.template = parentData.template
          }
          setParentProduct(parentData)
        } catch {
          toast.showError(
            t('products.edit.toast.parentVariantDoesNotExist.title'),
            t('products.edit.toast.parentVariantDoesNotExist.message')
          )
        }
      } else if (
        productData.productType === ProductType.parentVariant ||
        (productData.productType === ProductType.dynamicVariant &&
          !productData.parentVariantId)
      ) {
        setParentProduct(productData)
      }
      if (productData.mixins === undefined) {
        productData.mixins = {}
      }
      if (productData.metadata === undefined) {
        productData.metadata = {}
      }
      if (productData.metadata.mixins === undefined) {
        productData.metadata.mixins = {}
      }
      setProduct(productData)
    } else {
      const applySubscriptionToDraft = (
        draft: Partial<Product>
      ): Partial<Product> => {
        if (subscriptionParam !== 'true') {
          return draft
        }
        return {
          ...draft,
          mixins: {
            ...draft.mixins,
            subscription: {
              status: 'Active',
            },
          },
          metadata: {
            ...draft.metadata,
            mixins: {
              ...draft.metadata?.mixins,
              subscription:
                'https://res.cloudinary.com/saas-ag/raw/upload/v1684918636/jsonschemas/subscription.json?q=' +
                Math.random(),
            },
          },
        }
      }

      if (parentVariantIdParam) {
        try {
          const parentData = await getProduct(parentVariantIdParam)
          setParentProduct(parentData)

          if (getProductType() === ProductType.dynamicVariant) {
            if (siblingIdParam) {
              // Add sibling: fetch the clicked sibling and use it as blueprint
              const siblingData = await getProduct(siblingIdParam)
              const draft = buildDynamicVariantSiblingDraft(
                siblingData as Product,
                parentData as Product,
                parentVariantIdParam
              )
              setProduct(applySubscriptionToDraft(draft))
            } else {
              // Add child: copy parent for display, fields will be stripped on save
              const draft = buildDynamicVariantChildDraft(
                parentData as Product,
                parentVariantIdParam
              )
              setProduct(applySubscriptionToDraft(draft))
            }
          } else {
            const draftProduct: Partial<Product> = {
              productType: getProductType(),
              mixins: {},
              metadata: { mixins: {} },
              parentVariantId: parentVariantIdParam,
            }
            setProduct(applySubscriptionToDraft(draftProduct))
          }
        } catch {
          setParentProduct(undefined)
          toast.showError(
            t('products.edit.toast.parentVariantDoesNotExist.title'),
            t('products.edit.toast.parentVariantDoesNotExist.message')
          )
          const fallback: Partial<Product> = {
            productType: getProductType(),
            name: createEmptyLocalized(),
            mixins: {},
            metadata: { mixins: {} },
            parentVariantId: parentVariantIdParam,
          }
          if (getProductType() === ProductType.dynamicVariant) {
            fallback.ownVariantAttributes = {}
            fallback.sellable = false
          }
          setProduct(applySubscriptionToDraft(fallback))
        }
      } else {
        setParentProduct(undefined)
        const draftProduct: Partial<Product> = {
          productType: getProductType(),
          name: createEmptyLocalized(),
          mixins: {},
          metadata: { mixins: {} },
        }
        if (getProductType() === ProductType.dynamicVariant) {
          draftProduct.ownVariantAttributes = {}
          draftProduct.sellable = false
        }
        setProduct(applySubscriptionToDraft(draftProduct))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [
    id,
    subscriptionParam,
    parentVariantIdParam,
    siblingIdParam,
    getProductType,
    getProduct,
    toast,
    t,
  ])

  const [productTemplate] = useState<ProductTemplate>({
    name: createEmptyLocalized(),
    attributes: [],
  })
  const [product, setProduct] = useState<Partial<Product>>(defaultProduct)
  const [parentProduct, setParentProduct] = useState<Partial<Product>>()

  return (
    <ProductDataContext.Provider
      value={{
        product,
        parentProduct,
        productTemplate,
        refreshData,
      }}
    >
      {children}
    </ProductDataContext.Provider>
  )
}
