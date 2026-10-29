import { useCallback } from 'react'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useSites } from '../../context/SitesProvider'
import { Product } from '../../models/Category.model'
import { Price, ProductPrice } from '../../models/Price.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  createPriceCall,
  deletePriceCall,
  fetchProductPrices,
  searchProductPriceCall,
  updatePriceCall,
} from '@emporix/api-calls'
export const usePriceApi = () => {
  const { currentCurrency } = useConfiguration()
  const { tenant } = useDashboardContext()
  const { currentSite } = useSites()

  const syncProductPriceForSiteCode = useCallback(
    (id: string, siteCode: string) => {
      if (tenant && currentCurrency?.id && currentSite?.code) {
        return fetchProductPrices([id], tenant, currentCurrency?.id, siteCode)
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant, currentCurrency?.id, currentSite?.code]
  )
  const syncProductPrices = useCallback(
    (ids: string[]) => {
      if (tenant && currentCurrency?.id && currentSite?.code) {
        return fetchProductPrices(
          ids,
          tenant,
          currentCurrency?.id,
          currentSite?.code
        )
      } else {
        return Promise.reject('Missing args')
      }
    },
    [tenant, currentCurrency?.id, currentSite?.code]
  )

  const searchProductPrice = useCallback(
    (ids: string[], includesTax = true) => {
      if (tenant) {
        return searchProductPriceCall(ids, includesTax, tenant)
      } else {
        return Promise.reject('Missing args')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [tenant, currentCurrency?.id, currentSite?.code]
  )

  const createPrice = useCallback(
    (price: Partial<ProductPrice>, version: 'v1' | 'v2') => {
      if (tenant && currentCurrency?.id) {
        return createPriceCall(price, version, tenant)
      }
    },
    [tenant, currentCurrency?.id]
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
