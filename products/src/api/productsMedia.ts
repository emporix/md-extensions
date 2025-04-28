import { useCallback } from 'react'
import { api } from '.'
import { CloudinaryResponse } from '../models/CloudinaryResponce'
import { Product, ProductType } from '../models/Category'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export interface ProductMedia {
  url: string
  customAttributes: {
    isMain: boolean
    id: string
  }
}

export const getProductImagesCall = async (
  tenant: string,
  productId: string
) => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.get<ProductMedia[]>(
    `/product/${tenant}/products/${productId}/media`,
    { headers }
  )

  return data
}

export const addProductImageToCloudinaryCall = async (
  tenant: string,
  productId: string,
  encodedImage: string
) => {
  const headers = {
    'X-Version': 'v2',
    'Content-type': 'multipart/form-data',
  }
  const formData = new FormData()
  formData.append('file', encodedImage)
  formData.append('metadata', '{"domain": "product"}')
  const { data } = await api.post<CloudinaryResponse>(
    `/product/${tenant}/products/${productId}/media`,
    formData,
    { headers }
  )
  return data
}

export const deleteProductImageCall = async (
  tenant: string,
  productId: string,
  mediaId: string
) => {
  const headers = {
    'X-Version': 'v2',
  }
  await api.delete(
    `/product/${tenant}/products/${productId}/media/${mediaId}`,
    {
      headers,
    }
  )
}

const updateVariantOverridenIfNeeded = async (
  freshProductData: Product,
  tenant: string,
  productId: string,
  headers: { 'X-Version': string }
) => {
  if (freshProductData.productType === ProductType.variant) {
    const mediaOverridden =
      freshProductData.metadata && freshProductData.metadata.overridden
        ? [...freshProductData.metadata.overridden, 'media']
        : ['media']

    await api.put(
      `/product/${tenant}/products/${productId}/`,
      {
        ...freshProductData,
        metadata: {
          ...freshProductData.metadata,
          overridden: [...mediaOverridden],
        },
      },
      {
        headers,
      }
    )
  }
}

export const updateProductImageCall = async (
  tenant: string,
  productId: string,
  mediaId: string,
  productMedia: ProductMedia
) => {
  const headers = {
    'X-Version': 'v2',
  }
  await api.put(
    `/product/${tenant}/products/${productId}/media/${mediaId}`,
    productMedia,
    {
      headers,
    }
  )
  const { data: freshProductData } = await api.get(
    `/product/${tenant}/products/${productId}/`
  )
  await updateVariantOverridenIfNeeded(
    freshProductData,
    tenant,
    productId,
    headers
  )
}

export const addImageToProductCall = async (
  tenant: string,
  productId: string,
  mediaId: string,
  cloudinaryPic: CloudinaryResponse,
  mimeType: string,
  isMain = false
) => {
  const headers = {
    'X-Version': 'v2',
  }
  const { data } = await api.post<CloudinaryResponse>(
    `/product/${tenant}/products/${productId}/media2`,
    {
      url: cloudinaryPic.link,
      contentType: mimeType,
      tags: ['product'],
      customAttributes: {
        type: 'image/png',
        uploadLink: cloudinaryPic.link,
        commitLink: 'notUsing',
        id: mediaId,
        isMain,
        position: 0,
      },
      stored: true,
    }
  )

  const { data: freshProductData } = await api.get(
    `/product/${tenant}/products/${productId}/`
  )

  await updateVariantOverridenIfNeeded(
    freshProductData,
    tenant,
    productId,
    headers
  )

  return data
}

export const useProductMediaApi = () => {
  const { tenant } = useDashboardContext()

  const addProductImageToCloudinary = useCallback(
    (productId: string, encodedImage: string) => {
      if (tenant) {
        return addProductImageToCloudinaryCall(tenant, productId, encodedImage)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const addImageToProduct = useCallback(
    (
      productId: string,
      mediaId: string,
      cloudinaryPic: CloudinaryResponse,
      mimeType: string,
      isMain: boolean
    ) => {
      if (tenant) {
        return addImageToProductCall(
          tenant,
          productId,
          mediaId,
          cloudinaryPic,
          mimeType,
          isMain
        )
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const syncProductImages = useCallback(
    (productId: string) => {
      if (tenant) {
        return getProductImagesCall(tenant, productId)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const deleteProductImage = useCallback(
    (productId: string, mediaId: string) => {
      if (tenant) {
        return deleteProductImageCall(tenant, productId, mediaId)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const updateProductImage = useCallback(
    (productId: string, mediaId: string, productMedia: ProductMedia) => {
      if (tenant) {
        return updateProductImageCall(tenant, productId, mediaId, productMedia)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  return {
    addProductImageToCloudinary,
    addImageToProduct,
    syncProductImages,
    deleteProductImage,
    updateProductImage,
  }
}
