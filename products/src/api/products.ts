import { useCallback } from 'react'
import { api } from '.'
import { Product, ProductTemplate, ProductType } from '../models/Category'
import { PaginatedResponse, PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { usePriceApi } from './prices'
import { mapProductToProductRow, ProductRow } from './categories'
import {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from 'primereact/datatable'
import { useLocalizedValue } from '../hooks/useLocalizedValue.tsx'
import { Price } from '../models/Price'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

const enhanceProductTemplate = (
  productTemplate: ProductTemplate
): ProductTemplate => {
  return {
    ...productTemplate,
    filterName: Object.values(productTemplate.name).join(','),
  }
}

const fetchProducts = async (
  tenant: string,
  q: string,
  fields: string
): Promise<Product[]> => {
  const { data } = await api.get<Product[]>(`/product/${tenant}/products`, {
    params: {
      q,
      fields,
    },
  })
  return data
}

const fetchPaginatedProduct = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Product>> => {
  const filters: DataTableFilterMeta = {
    ...pagination.filters,
  }

  const { data, headers } = await api.get<Product[]>(
    `/product/${tenant}/products`,
    {
      params: {
        sort: formatPaginationParamsForSorting(pagination),
        ...formatPaginationParamsForEmporixPagination(pagination),
        q: formatFilterQuery(filters),
      },
      headers: {
        'x-total-count': true,
      },
    }
  )
  return { values: data, totalRecords: +headers['x-total-count'] }
}

const fetchCategoryProducts = async (
  tenant: string,
  ids: string[],
  pagination: Partial<PaginationProps>
): Promise<Product[]> => {
  const parsedIds = ids.toString()
  const { data } = await api.get<Product[]>(`/product/${tenant}/products`, {
    params: {
      fields: 'id,code,name,published,media,prices,mixins',
      sort: formatPaginationParamsForSorting(pagination),
      q: `id:(${parsedIds})`,
    },
    headers: {
      'x-version': 'v2',
    },
  })
  return data
}

const deleteProductCall = async (
  tenant: string,
  productId: string
): Promise<void> => {
  await api.delete(`/product/${tenant}/products/${productId}`)
}

const deleteProductTemplateCall = async (
  tenant: string,
  productId: string
): Promise<void> => {
  await api.delete(`/product/${tenant}/product-templates/${productId}`)
}

const createProductTemplateCall = async (
  tenant: string,
  productTemplate: Partial<ProductTemplate>
): Promise<{ id: string }> => {
  const { data } = await api.post(`/product/${tenant}/product-templates/`, {
    ...productTemplate,
  })
  return data
}

const editProductTemplateCall = async (
  tenant: string,
  productTemplate: Partial<ProductTemplate>
): Promise<void> => {
  await api.put(`/product/${tenant}/product-templates/${productTemplate.id}`, {
    ...productTemplate,
  })
}

const fetchProductCall = async (
  tenant: string,
  productId: string
): Promise<Product> => {
  const { data } = await api.get<Product>(
    `/product/${tenant}/products/${productId}`
  )
  return data
}

const fetchProductTemplateCall = async (
  tenant: string,
  productTemplateId: string,
  version?: number
): Promise<ProductTemplate> => {
  const { data } = await api.get<ProductTemplate>(
    `/product/${tenant}/product-templates/${productTemplateId}`,
    { params: { version: version?.toString() } }
  )
  return enhanceProductTemplate(data)
}

const patchProductCall = async (
  tenant: string,
  product: Partial<Product>
): Promise<Product> => {
  if (product.productType === ProductType.variant) {
    delete product.template
  }
  delete product?.metadata?.createdAt
  delete product?.metadata?.modifiedAt
  const { data } = await api.patch<Product>(
    `/product/${tenant}/products/${product.id}`,
    { ...product },
    {
      transformRequest: [
        (data, headers: any) => {
          delete headers['Content-Language']
          return data
        },
        // @ts-ignore
        ...api.defaults.transformRequest,
      ],
    }
  )
  return data
}

const updateProductCall = async (
  tenant: string,
  product: Partial<Product>
): Promise<Product> => {
  if (product.productType === ProductType.variant) {
    delete product.template
  }
  delete product?.metadata?.createdAt
  delete product?.metadata?.modifiedAt
  const { data } = await api.put<Product>(
    `/product/${tenant}/products/${product.id}`,
    { ...product },
    {
      transformRequest: [
        (data, headers: any) => {
          delete headers['Content-Language']
          return data
        },
        // @ts-ignore
        ...api.defaults.transformRequest,
      ],
    }
  )
  return data
}

const createProductCall = async (
  tenant: string,
  product: Partial<Product>
): Promise<{ id: string }> => {
  const { data } = await api.post<{ id: string }>(
    `/product/${tenant}/products`,
    { ...product },
    {
      transformRequest: [
        (data, headers: any) => {
          delete headers['Content-Language']
          return data
        },
        // @ts-ignore
        ...api.defaults.transformRequest,
      ],
    }
  )
  return data
}

const addImageCall = async (
  tenant: string,
  url: string,
  id: string,
  productId: string
): Promise<Product> => {
  const { data } = await api.post<Product>(
    `product/${tenant}/products/${productId}/media2`,
    {
      url,
      contentType: 'image/jpeg',
      position: 0,
      tags: ['product'],
      customAttributes: {
        uploadLink: url,
        commitLink: '',
        id: id,
        size: 'large',
      },
    }
  )
  return data
}

export const fetchProductTemplatesCall = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  id?: string
): Promise<PaginatedResponse<ProductTemplate>> => {
  const idFilter: DataTableFilterMetaData | null = id
    ? { matchMode: 'equals', value: id }
    : null

  if (idFilter) {
    pagination.filters = { ...pagination.filters, _id: idFilter }
  }

  const productTemplatesResponse = await api.get<ProductTemplate[]>(
    `/product/${tenant}/product-templates`,
    {
      params: {
        ...formatPaginationParamsForEmporixPagination(pagination),
        q: formatFilterQuery({ ...pagination.filters }),
        sort: formatPaginationParamsForSorting(pagination),
      },
      headers: {
        'X-Total-Count': true,
      },
    }
  )

  return {
    values: productTemplatesResponse.data.map(enhanceProductTemplate),
    totalRecords: +productTemplatesResponse.headers['x-total-count'],
  }
}

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
    async (paginationParams: Partial<PaginationProps>) => {
      if (tenant) {
        const { values, totalRecords } = await fetchPaginatedProduct(
          tenant,
          paginationParams
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
        return await fetchProductTemplatesCall(tenant, paginationParams, id)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const syncPaginatedProductsRows = useCallback(
    async (paginationParams: Partial<PaginationProps>) => {
      const { data, totalCount } = await syncPaginatedProducts(paginationParams)
      if (data.length === 0) {
        return { data: [], totalCount: 0 }
      }
      let id2price: Map<string, Price>
      try {
        id2price = await fetchPricesToMap(data)
      } catch (e) {
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
    [syncPaginatedProducts]
  )

  const fetchAllProducts = async (
    rows: ProductRow[] = [],
    pagination: PaginationProps | null = null
  ): Promise<ProductRow[]> => {
    if (!pagination) {
      pagination = {
        currentPage: 1,
        rows: 16,
      }
    }

    const { data, totalCount } = await syncPaginatedProductsRows(pagination)

    rows = [...rows, ...data]

    if (data.length === 0 || rows.length === totalCount) {
      return rows
    } else {
      pagination.currentPage++
      return fetchAllProducts(rows, pagination)
    }
  }

  const syncCategoryProducts = useCallback(
    (ids: string[], pagination: Partial<PaginationProps>) => {
      if (tenant) {
        return fetchCategoryProducts(tenant, ids, pagination)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const deleteProduct = useCallback(
    (productId: string) => {
      if (tenant) {
        return deleteProductCall(tenant, productId)
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
        return {
          ...product,
          name: product.name ? product.name : createEmptyLocalized(),
          description: product.description
            ? product.description
            : createEmptyLocalized(),
        }
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const patchProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return patchProductCall(tenant, product)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const updateProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return updateProductCall(tenant, product)
      } else {
        return Promise.reject('no client')
      }
    },
    [tenant]
  )

  const createProduct = useCallback(
    (product: Partial<Product>) => {
      if (tenant) {
        return createProductCall(tenant, product)
      } else {
        return Promise.reject('no client')
      }
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
  }
}
