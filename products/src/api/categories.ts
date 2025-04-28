import { useCallback } from 'react'
import { api, ID_SORTING_ASCENDING } from '.'
import {
  formatFilterQueryParams,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { PaginatedResponse, PaginationProps } from '../hooks/usePagination'
import {
  Category,
  CategoryProduct,
  Product,
  ProductType,
} from '../models/Category'
import { usePriceApi } from './prices'
import { useProductsApi } from './products'
import {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from 'primereact/datatable'
import { formatCurrency } from '../helpers/utils'
import Localized from '../models/Localized'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const fetchCategory = async (tenant: string, id: string) => {
  const response = await api.get<Category>(
    `/category/${tenant}/categories/${id}?showUnpublished=true`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return response.data
}
export const fetchCategoriesForProduct = async (
  tenant: string,
  productId: string
) => {
  const response = await api.get<Category[]>(
    `category/${tenant}/assignments/references/${productId}`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return response.data
}

export const modifyCategory = async (tenant: string, category: Category) => {
  const categoryData = { ...category }
  const response = await api.put<Category>(
    `/category/${tenant}/categories/${category.id}?publish=${categoryData.published}`,
    {
      ...categoryData,
      metadata: {
        version: categoryData.metadata.version,
      },
    },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return response.data
}

export const patchCategoryCall = async (
  tenant: string,
  category: Partial<Category>
) => {
  const categoryData = { ...category }
  const publishQueryParam =
    categoryData.published !== undefined
      ? `?publish=${categoryData.published}`
      : ''
  const url =
    `/category/${tenant}/categories/${category.id}` + publishQueryParam
  const response = await api.patch<Category>(
    url,
    {
      ...categoryData,
      metadata: {
        version: categoryData?.metadata?.version,
      },
    },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return response.data
}

export const fetchCategoryAssignments = async (
  tenant: string,
  id: string,
  pagination: Partial<PaginationProps>
): Promise<{ categoryProducts: CategoryProduct[]; total: number }> => {
  let nameFilterValue = null
  let idFilterValue = null
  if (pagination.filters) {
    nameFilterValue = (
      pagination.filters['ref.localizedName'] as DataTableFilterMetaData
    ).value
    idFilterValue = (pagination.filters['ref.id'] as DataTableFilterMetaData)
      .value
  }

  const response = await api.get<CategoryProduct[]>(
    `/category/${tenant}/categories/${id}/assignments`,
    {
      params: {
        sort: formatPaginationParamsForSorting(pagination),
        ...formatPaginationParamsForEmporixPagination(pagination),
        'ref.id': idFilterValue?.replaceAll(' ', ''),
        'ref.localizedName': nameFilterValue?.replaceAll(' ', ''),
        withSubcategories: false,
        showUnpublished: true,
      },
      headers: {
        'x-version': 'v2',
        'x-total-count': true,
      },
    }
  )
  return {
    categoryProducts: response.data,
    total: parseInt(response.headers['x-total-count']),
  }
}

export const fetchCategories = async (tenant: string): Promise<Category[]> => {
  const { data } = await api.get<Category[]>(
    `category/${tenant}/categories?showRoots=true&showUnpublished=true`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

export const fetchSubcategories = async (
  tenant: string,
  id: string,
  depth = 1,
  sort = ID_SORTING_ASCENDING,
  showUnpublished = true
): Promise<Category[]> => {
  const { data } = await api.get<Category[]>(
    `category/${tenant}/categories/${id}/subcategories`,
    {
      params: {
        depth,
        sort,
        showUnpublished,
      },
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

export interface ProductRow {
  id: string
  imageUrl: string | null
  name: string
  code: string
  productType: ProductType
  ref: {
    localizedName: Localized
    id: string
  }
  price: string
  mixins: any
  metadata?: {
    createdAt?: string
  }
}

export const mapProductToProductRow = (
  product: Product,
  price: number,
  currency: string
): ProductRow => {
  let imageUrl = null
  if (product.media) {
    const media = product.media[0]
    if (media) {
      imageUrl = media.url
    }
  }

  return {
    id: product.id || '',
    ref: {
      localizedName: product.name,
      id: product.id || '',
    },
    code: product.code,
    productType: product.productType,
    imageUrl,
    name: product.name ? Object.values(product.name)[0] : '-',
    price: formatCurrency(currency, price),
    mixins: product.mixins,
    metadata: {
      createdAt: product?.metadata?.createdAt,
    },
  }
}

export const getPaginatedCategories = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Category>> => {
  const filters: DataTableFilterMeta = {
    ...pagination.filters,
  }

  const { data, headers } = await api.get<Category[]>(
    `/category/${tenant}/categories/`,
    {
      params: {
        sort: formatPaginationParamsForSorting(pagination),
        ...formatPaginationParamsForEmporixPagination(pagination),
        ...formatFilterQueryParams(filters),
        showUnpublished: true,
      },
      headers: {
        'x-version': 'v2',
        'X-Total-Count': true,
      },
    }
  )
  return { values: data, totalRecords: parseInt(headers['x-total-count']) }
}

export const createNewCategory = async (
  tenant: string,
  categoryData: Partial<Category>
): Promise<string> => {
  const { data } = await api.post<{ id: string }>(
    `/category/${tenant}/categories?publish=${categoryData.published}`,
    { ...categoryData },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data.id
}

export const assignProductToCategoryCall = async (
  tenant: string,
  categoryId: string,
  productId: string
): Promise<string> => {
  const { data } = await api.post<{ id: string }>(
    `category/${tenant}/categories/${categoryId}/assignments`,
    { ref: { id: productId, type: 'PRODUCT' } },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data.id
}

export const deleteAssignmentToCategoryCall = async (
  tenant: string,
  categoryId: string,
  productId: string
): Promise<string> => {
  const { data } = await api.delete<{ id: string }>(
    `category/${tenant}/categories/${categoryId}/assignments/references/${productId}`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data.id
}

export const deleteSingleCategory = async (
  tenant: string,
  categoryId: string,
  withSubcategories: boolean
) => {
  const deleteResponse = await api.delete(
    `category/${tenant}/categories/${categoryId}`,
    {
      params: { withSubcategories },
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return deleteResponse.data
}

export const getCategoryParentsCall = async (
  tenant: string,
  categoryId: string
): Promise<Category[]> => {
  const { data } = await api.get<Category[]>(
    `/category/${tenant}/categories/${categoryId}/parents`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

export const useCategoriesApi = () => {
  const { tenant } = useDashboardContext()
  const { fetchPricesToMap } = usePriceApi()
  const { syncCategoryProducts } = useProductsApi()
  const syncCategories = useCallback(() => {
    if (tenant) {
      return fetchCategories(tenant)
    } else {
      return Promise.reject('no client')
    }
  }, [tenant])

  const syncSubCategories = useCallback(
    async (id: string) => {
      if (tenant) {
        return await fetchSubcategories(tenant, id)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const syncCategoryAssignments = useCallback(
    async (
      id: string,
      paginationParams: PaginationProps
    ): Promise<{ total: number; productRows: ProductRow[] }> => {
      if (tenant) {
        const productsCategories = await fetchCategoryAssignments(
          tenant,
          id,
          paginationParams
        )

        const ids = productsCategories.categoryProducts.map(
          (catProd: CategoryProduct) => catProd.ref.id
        )
        const data = await syncCategoryProducts(ids, paginationParams)
        if (data.length === 0) {
          return { total: productsCategories.total, productRows: [] }
        }
        const id2price = await fetchPricesToMap(data)
        const productRows = data.map((product) => {
          const price = id2price.get(product.id || '')
          return mapProductToProductRow(
            product,
            Number(price?.tierValues[0].priceValue || '0'),
            price?.currency || 'EUR'
          )
        })

        return { total: productsCategories.total, productRows }
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const fetchAllCategoryProducts = async (
    id: string,
    rows: ProductRow[] = [],
    pagination: PaginationProps | null = null
  ): Promise<ProductRow[]> => {
    if (!pagination) {
      pagination = {
        currentPage: 1,
        rows: 16,
      }
    }

    const { total, productRows } = await syncCategoryAssignments(id, pagination)

    rows = [...rows, ...productRows]

    if (productRows.length === 0 || rows.length === total) {
      return rows
    } else {
      pagination.currentPage++
      return fetchAllCategoryProducts(id, rows, pagination)
    }
  }

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
    (category: Category): Promise<unknown> => {
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
    (paginationParams: Partial<PaginationProps>) => {
      if (tenant) {
        return getPaginatedCategories(tenant, paginationParams)
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
    updateCategory,
    patchCategory,
    fetchAllCategoryProducts,
    createCategory,
    syncCategoryAssignments,
    syncCategories,
    syncSubCategories,
    deleteCategory,
    fetchCategoriesForAssignment,
    assignProductToCategory,
    deleteAssignmentToCategory,
    getCategoryParents,
  }
}
