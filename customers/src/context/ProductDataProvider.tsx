import { createContext, FC, useContext } from 'react'
import { Props } from '../helpers/props'
import {
  Category,
  Product,
  ProductTemplate,
} from '../models/Category'
import Localized from '../models/Localized'

interface ProductData {
  product: Partial<Product> | undefined
  parentProduct: Partial<Product> | undefined
  productTemplate: ProductTemplate
  categories: Category[]
  refreshData: () => void
}

const emptyTemplate: ProductTemplate = {
  attributes: [],
  name: {} as Localized,
}

/**
 * Customer extension does not load product data; InputField and others only need a safe context.
 */
const ProductDataContext = createContext<ProductData>({
  product: undefined,
  parentProduct: undefined,
  productTemplate: emptyTemplate,
  categories: [],
  refreshData: () => {},
})

export const useProductData = () => useContext(ProductDataContext)

export const ProductDataProvider: FC<Props> = ({ children }) => {
  return (
    <ProductDataContext.Provider
      value={{
        product: undefined,
        parentProduct: undefined,
        productTemplate: emptyTemplate,
        categories: [],
        refreshData: () => {},
      }}
    >
      {children}
    </ProductDataContext.Provider>
  )
}
