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
import {
  Category,
  Product,
  ProductTemplate,
  ProductType,
} from '../models/Category'
import { useLocalizedValue } from '../hooks/useLocalizedValue.tsx'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProductsApi } from '../api/products'
import Localized from '../models/Localized'
import { useToast } from './ToastProvider'
import { useTranslation } from 'react-i18next'

const PRODUCT_TYPE_PARAM_NAME = 'type'
const PRODUCT_SUBSCRIPTION_PARAM_NAME = 'subscription'

interface ProductData {
  product: Partial<Product>
  parentProduct: Partial<Product> | undefined
  productTemplate: ProductTemplate
  categories: Category[]
  refreshData: () => void
}

const ProductDataContext = createContext<ProductData>({
  product: {} as Partial<Product>,
  parentProduct: {} as Partial<Product>,
  productTemplate: { attributes: [], name: {} as Localized },
  categories: [],
  refreshData: () => {
    //NOOP
  },
})

export const useProductData = () => useContext(ProductDataContext)

export const ProductDataProvider: FC<Props> = ({ children }) => {
  const [searchParams] = useSearchParams()
  const { getProduct } = useProductsApi()
  const { createEmptyLocalized } = useLocalizedValue()
  const toast = useToast()
  const { t } = useTranslation()

  const { id } = useParams()

  const getProductType = useCallback(() => {
    const urlType = searchParams.get(PRODUCT_TYPE_PARAM_NAME)
    const typesValues: string[] = Object.values(ProductType)

    return urlType && typesValues.includes(urlType)
      ? (urlType as ProductType)
      : ProductType.basic
  }, [searchParams])

  const defaultProduct = useMemo<Partial<Product>>(() => {
    return {
      name: createEmptyLocalized(),
      published: false,
      productType: getProductType(),
      media: [],
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [id, searchParams])

  const refreshData = useCallback(async () => {
    if (id) {
      const productData: Product = await getProduct(id)
      if (productData.parentVariantId) {
        try {
          const parentData = await getProduct(productData.parentVariantId)
          productData.template = parentData.template
          setParentProduct(parentData)
        } catch (ex) {
          toast.showError(
            t('products.edit.toast.parentVariantDoesNotExist.title'),
            t('products.edit.toast.parentVariantDoesNotExist.message')
          )
        }
      } else if (productData.productType === ProductType.parentVariant) {
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
      const draftProduct = {
        productType: getProductType(),
        mixins: {},
        metadata: { mixins: {} },
      }
      if (searchParams.get(PRODUCT_SUBSCRIPTION_PARAM_NAME) === 'true') {
        //@ts-ignore
        draftProduct['mixins'] = {
          subscription: {
            status: 'Active',
          },
        }
        //@ts-ignore
        draftProduct['metadata'] = {
          mixins: {
            subscription:
              'https://res.cloudinary.com/saas-ag/raw/upload/v1684918636/jsonschemas/subscription.json?q=' +
              Math.random(),
          },
        }
      }
      setProduct(draftProduct)
    }
  }, [id, searchParams])

  const [productTemplate] = useState<ProductTemplate>({
    name: createEmptyLocalized(),
    attributes: [],
  })
  const [product, setProduct] = useState<Partial<Product>>(defaultProduct)
  const [parentProduct, setParentProduct] = useState<Partial<Product>>()
  const [categories] = useState<Category[]>([])
  return (
    <ProductDataContext.Provider
      value={{
        product,
        parentProduct,
        productTemplate,
        categories,
        refreshData,
      }}
    >
      {children}
    </ProductDataContext.Provider>
  )
}
