import { useCallback } from 'react'
import {
  addImageCall,
  createProductCall,
  createProductTemplateCall,
  deleteProductWithForceCall,
  deleteProductTemplateCall,
  editProductTemplateCall,
  fetchCategoryProducts,
  fetchPaginatedProduct,
  fetchProductCall,
  fetchProducts,
  fetchProductTemplateCall,
  fetchProductTemplatesCall,
  mapProductToProductRow,
  patchProductCall,
  triggerDynamicVariantRecalculationCall,
  updateProductCall,
  type ProductRow,
} from '@emporix/api-calls'
import {
  Product,
  ProductTemplate,
  ProductType,
} from '../../models/Category.model'
import { PaginationProps } from '../usePagination'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import { usePriceApi } from './prices'
import { useLocalizedValue } from '../useLocalizedValue'
import { Price } from '../../models/Price.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { fetchAllRecords } from '../../helpers/paginationUtils'
export const useProductsApi = () => {
  const { tenant } = useDashboardContext()

  const { createEmptyLocalized } = useLocalizedValue()
  const { fetchPricesToMap } = usePriceApi()

  const syncProducts = useCallback(
    (q: string, fields = 'id,name,media') => {
      if (tenant) {
        return fetchProducts(tenant, q, fields)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const syncPaginatedProducts = useCallback(
    async (
      paginationParams: Partial<PaginationProps>,
      withTotalCount = true
    ) => {
      if (tenant) {
        const { values, totalRecords } = await fetchPaginatedProduct(
          tenant,
          toApiPagination(paginationParams),
          withTotalCount
        )
        return { data: values, totalCount: totalRecords }
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const fetchProductTemplates = useCallback(
    async (paginationParams: Partial<PaginationProps>, id?: string) => {
      if (tenant) {
        return await fetchProductTemplatesCall(
          tenant,
          toApiPagination(paginationParams),
          id
        )
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const syncPaginatedProductsRows = useCallback(
    async (
      paginationParams: Partial<PaginationProps>,
      withTotalCount = true
    ) => {
      const { data, totalCount } = await syncPaginatedProducts(
        paginationParams,
        withTotalCount
      )
      if (data.length === 0) {
        return { data: [], totalCount: 0 }
      }
      let id2price: Map<string, Price>
      try {
        id2price = await fetchPricesToMap(data)
      } catch {
        console.error('error while fetchnig prices, no prices fetched')
      }
      const productRows = data.map((product) => {
        if (!product.id) {
          throw new Error('no product id')
        }
        const price = id2price ? id2price.get(product.id) : undefined
        return mapProductToProductRow(
          product,
          Number(price?.tierValues[0]?.priceValue || '0'),
          price?.currency || ''
        )
      })
      return { data: productRows, totalCount }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncPaginatedProducts]
  )

  const fetchAllProducts = async (
    initialPagination: Partial<PaginationProps> = apiPagination({
      currentPage: 1,
      rows: 100,
    })
  ): Promise<ProductRow[]> => {
    const fetchPage = async (pagination: Partial<PaginationProps>) => {
      const { data, totalCount } = await syncPaginatedProductsRows(pagination)
      return {
        values: data,
        totalRecords: totalCount,
      }
    }

    return fetchAllRecords(fetchPage, initialPagination)
  }

  const getAllProducts = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<Product[]> => {
      const fetchPage = async (p: Partial<PaginationProps>) => {
        const { data, totalCount } = await syncPaginatedProducts(p)
        return { values: data, totalRecords: totalCount }
      }
      return fetchAllRecords(fetchPage, {
        currentPage: 1,
        rows: 100,
        ...pagination,
      })
    },
    [syncPaginatedProducts]
  )

  const syncCategoryProducts = useCallback(
    (ids: string[], pagination: Partial<PaginationProps>) => {
      if (tenant) {
        return fetchCategoryProducts(tenant, ids, toApiPagination(pagination))
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const deleteProduct = useCallback(
    (productId: string, force = false) => {
      if (tenant) {
        return deleteProductWithForceCall(tenant, productId, force)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const deleteProductTemplate = useCallback(
    (productTemplateId: string) => {
      if (tenant) {
        return deleteProductTemplateCall(tenant, productTemplateId)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const createProductTemplate = useCallback(
    (productTemplate: Partial<ProductTemplate>) => {
      if (tenant) {
        return createProductTemplateCall(tenant, productTemplate)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const editProductTemplate = useCallback(
    (productTemplate: Partial<ProductTemplate>) => {
      if (tenant) {
        return editProductTemplateCall(tenant, productTemplate)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const deleteProducts = (productIds: string[]) => {
    return Promise.all(
      productIds.map((productId: string) => {
        return deleteProduct(productId)
      })
    )
  }

  const getProduct = useCallback(
    async (productId: string) => {
      if (tenant) {
        const product = await fetchProductCall(tenant, productId)
        const normalized = {
          ...product,
          name: product.name ? product.name : createEmptyLocalized(),
          description: product.description
            ? product.description
            : createEmptyLocalized(),
        } as Product
        if (
          normalized.productType === ProductType.dynamicVariant &&
          normalized.ownVariantAttributes === undefined
        ) {
          normalized.ownVariantAttributes = {}
        }
        return normalized
      } else {
        return Promise.reject('no client')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant]
  )

  const patchProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return patchProductCall(
          tenant,
          product as Parameters<typeof patchProductCall>[1]
        )
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const updateProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return updateProductCall(
          tenant,
          product as Parameters<typeof updateProductCall>[1]
        )
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const createProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return createProductCall(
          tenant,
          product as Parameters<typeof createProductCall>[1]
        )
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const triggerDynamicVariantRecalculation = useCallback(
    (productIds: string[]) => {
      if (tenant) {
        return triggerDynamicVariantRecalculationCall(tenant, productIds)
      }
      return Promise.reject('no client')
    },
    [tenant]
  )

  const addImage = useCallback(
    (url: string, id: string, productId: string) => {
      if (tenant) {
        return addImageCall(tenant, url, id, productId)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const fetchProductTemplate = useCallback(
    async (id: string, version?: number) => {
      if (tenant) {
        return await fetchProductTemplateCall(tenant, id, version)
      } else {
        return Promise.reject('No Tenant')
      }
    },
    [tenant]
  )

  return {
    fetchAllProducts,
    getAllProducts,
    getProduct,
    syncProducts,
    patchProduct,
    syncPaginatedProducts,
    syncCategoryProducts,
    deleteProduct,
    deleteProducts,
    updateProduct,
    createProduct,
    addImage,
    syncPaginatedProductsRows,
    fetchProductTemplates,
    fetchProductTemplate,
    deleteProductTemplate,
    createProductTemplate,
    editProductTemplate,
    triggerDynamicVariantRecalculation,
  }
}
