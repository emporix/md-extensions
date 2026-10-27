import { useCallback } from 'react'
import {
  assignProductToCategoryCall,
  createNewCategory,
  deleteAssignmentToCategoryCall,
  deleteSingleCategory,
  fetchCategoriesForProduct,
  fetchCategory,
  fetchCategoryAssignments,
  getCategories,
  getCategoryParentsCall,
  getSubcategoriesCall,
  mapMissingProductToProductRow,
  mapProductToProductRow,
  modifyCategory,
  patchCategoryCall,
  type ProductRow,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import {
  Category,
  CategoryProduct,
  CategoryType,
  Product,
} from '../../models/Category.model'
import { usePriceApi } from './prices'
import { useProductsApi } from './products'
import { useDashboardContext } from '../../context/Dashboard.context'
import { fetchAllRecords } from '../../helpers/paginationUtils'

export const useCategoriesApi = () => {
  const { tenant } = useDashboardContext()
  const { fetchPricesToMap } = usePriceApi()
  const { syncCategoryProducts } = useProductsApi()

  const syncCategoryAssignments = useCallback(
    async (
      id: string,
      paginationParams: Partial<PaginationProps>
    ): Promise<{ total: number; productRows: ProductRow[] }> => {
      if (tenant) {
        const productsCategories = await fetchCategoryAssignments(
          tenant,
          id,
          toApiPagination(paginationParams)
        )

        const ids = productsCategories.categoryProducts.map(
          (catProd: CategoryProduct) => catProd.ref.id
        )
        const data = await syncCategoryProducts(ids, paginationParams)

        const productMap = new Map<string, Product>()
        data.forEach((product) => {
          if (product.id) {
            productMap.set(product.id, product)
          }
        })

        const id2price =
          data.length > 0 ? await fetchPricesToMap(data) : new Map()

        const productRows = productsCategories.categoryProducts.map(
          (categoryProduct: CategoryProduct) => {
            const product = productMap.get(categoryProduct.ref.id)
            if (product) {
              const price = id2price.get(product.id || '')
              return mapProductToProductRow(
                product as Parameters<typeof mapProductToProductRow>[0],
                Number(price?.tierValues[0].priceValue || '0'),
                price?.currency || 'EUR'
              )
            }
            return mapMissingProductToProductRow(categoryProduct)
          }
        )

        return { total: productsCategories.total, productRows }
      } else {
        return Promise.reject('no client')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant]
  )

  const getAllCategoryProducts = async (
    id: string,
    initialPagination: Partial<PaginationProps> = apiPagination({
      currentPage: 1,
      rows: 100,
    })
  ): Promise<ProductRow[]> => {
    const fetchPage = async (pagination: Partial<PaginationProps>) => {
      const { total, productRows } = await syncCategoryAssignments(
        id,
        pagination
      )
      return {
        values: productRows,
        totalRecords: total,
      }
    }

    return fetchAllRecords(fetchPage, initialPagination)
  }

  const getAllCategories = async (
    initialPagination: Partial<PaginationProps> = apiPagination({
      currentPage: 1,
      rows: 100,
    }),
    type?: CategoryType,
    showRoots?: boolean,
    showUnpublished?: boolean
  ): Promise<Category[]> => {
    const fetchPage = async (pagination: Partial<PaginationProps>) => {
      if (!tenant) {
        throw new Error('No tenant provided')
      }
      return getCategories(
        tenant,
        toApiPagination(pagination),
        type,
        showRoots,
        showUnpublished
      )
    }
    return fetchAllRecords(fetchPage, initialPagination)
  }

  const getSubCategories = useCallback(
    async (id: string, depth = 1) => {
      if (tenant) {
        return await getSubcategoriesCall(tenant, id, depth)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const getCategory = useCallback(
    (id: string): Promise<Category> => {
      if (tenant) {
        return fetchCategory(tenant, id)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const fetchCategoriesForAssignment = useCallback(
    (productId: string): Promise<Category[]> => {
      if (tenant) {
        return fetchCategoriesForProduct(tenant, productId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const updateCategory = useCallback(
    (category: Partial<Category>): Promise<unknown> => {
      if (tenant) {
        return modifyCategory(tenant, category)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const patchCategory = useCallback(
    (category: Partial<Category>): Promise<unknown> => {
      if (tenant) {
        return patchCategoryCall(tenant, category)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getCategoriesPaginated = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      type?: CategoryType,
      showRoots?: boolean,
      showUnpublished?: boolean
    ) => {
      if (tenant) {
        return getCategories(
          tenant,
          toApiPagination(paginationParams),
          type,
          showRoots,
          showUnpublished
        )
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const createCategory = useCallback(
    (categoryData: Partial<Category>) => {
      if (tenant) {
        return createNewCategory(tenant, categoryData)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const assignProductToCategory = useCallback(
    (categoryId: string, productId: string) => {
      if (tenant) {
        return assignProductToCategoryCall(tenant, categoryId, productId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const deleteAssignmentToCategory = useCallback(
    (categoryId: string, productId: string) => {
      if (tenant) {
        return deleteAssignmentToCategoryCall(tenant, categoryId, productId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const deleteCategory = useCallback(
    (categoryId: string, withSubcategories = true) => {
      if (tenant) {
        return deleteSingleCategory(tenant, categoryId, withSubcategories)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getCategoryParents = useCallback(
    (categoryId: string) => {
      if (tenant) {
        return getCategoryParentsCall(tenant, categoryId)
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  return {
    getCategory,
    getCategoriesPaginated,
    getAllCategoryProducts,
    getAllCategories,
    getSubCategories,
    updateCategory,
    patchCategory,
    createCategory,
    syncCategoryAssignments,
    deleteCategory,
    fetchCategoriesForAssignment,
    assignProductToCategory,
    deleteAssignmentToCategory,
    getCategoryParents,
  }
}
