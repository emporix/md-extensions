import { useCallback } from 'react'
import {
  createProductAvailabilityCall,
  fetchAvailabilityForProduct,
  searchAvailabilitiesCall,
  updateProductAvailabilityCall,
  type Availability,
} from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useAvailabilityApi = () => {
  const { tenant } = useDashboardContext()

  const fetchAvailabilityForProductPerSite = useCallback(
    (productId: string, site: string) => {
      if (tenant) {
        return fetchAvailabilityForProduct(tenant, productId, site)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllAvailabilities = useCallback(
    (productId: string): Promise<Availability[]> => {
      if (tenant) {
        return searchAvailabilitiesCall(tenant, [productId])
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateProductAvailability = useCallback(
    (productId: string, site: string, availability: Availability) => {
      if (tenant) {
        return updateProductAvailabilityCall(
          tenant,
          productId,
          site,
          availability
        )
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createProductAvailability = useCallback(
    (productId: string, site: string, availability: Availability) => {
      if (tenant) {
        return createProductAvailabilityCall(
          tenant,
          productId,
          site,
          availability
        )
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  return {
    fetchAvailabilityForProductPerSite,
    getAllAvailabilities,
    updateProductAvailability,
    createProductAvailability,
  }
}
