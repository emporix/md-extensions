import { useCallback } from 'react'
import { api } from '.'
import { useSites } from '../context/SitesProvider'
import { Product } from '../models/Category'
import { Price, ProductPrice } from '../models/Price'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const fetchProductPrices = async (
  ids: string[],
  tenant: string,
  targetCurrency: string,
  siteCode: string
): Promise<ProductPrice[]> => {
  const { data } = await api.post<ProductPrice[]>(
    `price/${tenant}/prices/matchProductCurrency`,
    {
      targetCurrency,
      siteCode,
      products: ids.map((productId) => ({
        productId,
        quantity: 1,
      })),
    }
  )
  return data
}

export interface PriceResponse {
  itemId: string
  prices: Price[]
}

export const searchProductPriceCall = async (
  ids: string[],
  includesTax: boolean,
  tenant: string
): Promise<PriceResponse[]> => {
  const { data } = await api.post<PriceResponse[]>(
    `price/${tenant}/prices/search`,
    {
      itemIds: ids,
      useFallback: true,
      includesTax,
      expand: 'priceModel',
    },
    { headers: { 'x-version': 'v2' } }
  )
  return data
}

export const createPriceCall = async (
  price: Partial<ProductPrice>,
  _version: 'v1' | 'v2',
  tenant: string
): Promise<any> => {
  const { data } = await api.post<ProductPrice[]>(`price/${tenant}/prices`, {
    ...price,
    effectiveAmount: price.effectiveAmount,
  })
  return data
}

export const updatePriceCall = async (
  price: Partial<ProductPrice>,
  _version: 'v1' | 'v2',
  tenant: string
): Promise<any> => {
  const { status } = await api.put<ProductPrice[]>(
    `price/${tenant}/prices/${price.priceId}?partial=true`,
    {
      ...price,
    }
  )
  return status === 200
}

export const deletePriceCall = async (
  priceId: string,
  _version: 'v1' | 'v2',
  tenant: string
): Promise<any> => {
  const { status } = await api.delete<ProductPrice[]>(
    `price/${tenant}/prices/${priceId}`
  )
  return status === 200
}

export const usePriceApi = () => {
  const { currency } = useDashboardContext()
  const { tenant } = useDashboardContext()
  const { currentSite } = useSites()

  const syncProductPriceForSiteCode = useCallback(
    (id: string, siteCode: string) => {
      if (tenant && currency?.id && currentSite?.code) {
        return fetchProductPrices([id], tenant, currency?.id, siteCode)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant, currency?.id, currentSite?.code]
  )
  const syncProductPrices = useCallback(
    (ids: string[]) => {
      if (tenant && currency?.id && currentSite?.code) {
        return fetchProductPrices(ids, tenant, currency?.id, currentSite?.code)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant, currency?.id, currentSite?.code]
  )

  const searchProductPrice = useCallback(
    (ids: string[], includesTax = true) => {
      if (tenant) {
        return searchProductPriceCall(ids, includesTax, tenant)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant, currency?.id, currentSite?.code]
  )

  const createPrice = useCallback(
    (price: Partial<ProductPrice>, version: 'v1' | 'v2') => {
      if (tenant && currency?.id) {
        return createPriceCall(price, version, tenant)
      }
    },
    [tenant, currency?.id]
  )

  const updatePrice = useCallback(
    (price: Partial<ProductPrice>, version: 'v1' | 'v2') => {
      if (tenant) {
        return updatePriceCall(price, version, tenant)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant]
  )

  const deletePrice = useCallback(
    (priceId: string, version: 'v1' | 'v2') => {
      if (tenant) {
        return deletePriceCall(priceId, version, tenant)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant]
  )
  const fetchPricesToMap = async (products: Product[]) => {
    const id2Price = new Map<string, Price>()

    const ids = products
      .map((product) => product.id || '')
      .filter((id) => !id2Price.get(id))

    const prices = await searchProductPrice(ids, false)
    prices.forEach((priceResponse) => {
      id2Price.set(priceResponse.itemId, priceResponse.prices[0])
    })
    return id2Price
  }

  return {
    searchProductPrice,
    fetchPricesToMap,
    syncProductPriceForSiteCode,
    syncProductPrices,
    createPrice,
    updatePrice,
    deletePrice,
  }
}
