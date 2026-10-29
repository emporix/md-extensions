import { useCallback } from 'react'
import { PaginationProps } from '../usePagination'
import { PriceModel } from '../../models/PriceModel.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  createNewPriceModel,
  deletePriceModel,
  getPriceModels,
  getSinglePriceModel,
  modifyPriceModel,
  type PaginatedResponse,
} from '@emporix/api-calls'
import { toApiPagination } from '../../helpers/apiPagination'

export const usePriceModelsApi = () => {
  const { tenant } = useDashboardContext()

  const getPriceModelsPaginated = useCallback(
    async (
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<PriceModel>> => {
      if (tenant) {
        return getPriceModels(tenant, toApiPagination(pagination))
      } else {
        return Promise.reject('No tenant provided')
      }
    },
    [tenant]
  )

  const getPriceModel = useCallback(
    (priceModelId: string): Promise<PriceModel> => {
      if (tenant && priceModelId) {
        return getSinglePriceModel(tenant, priceModelId)
      } else {
        return Promise.reject('No tenant or price model ID provided')
      }
    },
    [tenant]
  )

  const createPriceModel = useCallback(
    (priceModel: PriceModel) => {
      if (tenant) {
        return createNewPriceModel(tenant, priceModel)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const editPriceModel = useCallback(
    (priceModel: PriceModel) => {
      if (tenant) {
        return modifyPriceModel(tenant, priceModel)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const removePriceModel = useCallback(
    async (priceModelId: string | undefined, forceDelete: boolean) => {
      if (tenant && priceModelId) {
        return deletePriceModel(tenant, priceModelId, forceDelete)
      } else {
        return Promise.reject('No tenant or price model ID provided')
      }
    },
    [tenant]
  )

  return {
    getPriceModelsPaginated,
    getPriceModel,
    createPriceModel,
    editPriceModel,
    removePriceModel,
  }
}
