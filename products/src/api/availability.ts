import { useCallback } from 'react'
import { api } from '.'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export type DistributionChannel = 'ASSORTMENT' | 'HOME_DELIVERY' | 'PICKUP'

export interface Availability {
  id: string
  site: string
  stockLevel: number
  available: boolean
  productId: string
  popularity: number
  createdAt: string
  modifiedAt: string
  distributionChannel: DistributionChannel
}

export const fetchAvailabilityForProduct = async (
  tenant: string,
  productId: string,
  site: string
): Promise<Availability> => {
  const { data } = await api.get<Availability>(
    `availability/${tenant}/availability/${productId}`,
    {
      params: {
        site,
      },
    }
  )
  return data
}

export const updateProductAvailabilityCall = async (
  tenant: string,
  productId: string,
  site: string,
  availability: Availability
): Promise<Availability> => {
  const { data } = await api.put<Availability>(
    `availability/${tenant}/availability/${productId}`,
    {
      ...availability,
    },
    {
      params: {
        site,
      },
    }
  )
  return data
}
export const createProductAvailabilityCall = async (
  tenant: string,
  productId: string,
  site: string,
  availability: Partial<Availability>
): Promise<Availability> => {
  const { data } = await api.post<Availability>(
    `availability/${tenant}/availability/${productId}`,
    {
      ...availability,
    },
    {
      params: {
        site,
      },
    }
  )
  return data
}

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
    updateProductAvailability,
    createProductAvailability,
  }
}
