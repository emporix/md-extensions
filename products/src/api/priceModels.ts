import { useCallback } from 'react'
import { PaginationProps } from '../hooks/usePagination'
import { PriceModel } from '../models/PriceModel'
import { api } from './index'
import {
  formatFilterQueryParams,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export interface PaginatedResponse<Type> {
  values: Type[]
  totalRecords: number
}

export const getPriceModels = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<PriceModel>> => {
  const { data, headers } = await api.get<PriceModel[]>(
    `price/${tenant}/priceModels/`,
    {
      params: {
        ...formatFilterQueryParams(pagination.filters),
        sort: formatPaginationParamsForSorting(pagination),
        ...formatPaginationParamsForEmporixPagination(pagination),
      },
      headers: {
        'x-version': 'v2',
        'x-total-count': true,
      },
    }
  )
  return { values: data, totalRecords: +headers['x-total-count'] }
}

export const getSinglePriceModel = async (
  tenant: string,
  priceModelId: string
): Promise<PriceModel> => {
  const { data } = await api.get<PriceModel>(
    `price/${tenant}/priceModels/${priceModelId}`,
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return data
}

export const createNewPriceModel = async (
  tenant: string,
  priceModel: PriceModel
): Promise<string> => {
  const { data } = await api.post<Partial<PriceModel>>(
    `price/${tenant}/priceModels`,
    {
      ...priceModel,
    },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )

  return data.id as string
}

export const modifyPriceModel = async (
  tenant: string,
  priceModel: PriceModel
): Promise<boolean> => {
  const priceModelResponse = await api.put<PriceModel>(
    `price/${tenant}/priceModels/${priceModel.id}`,
    { ...priceModel },
    {
      headers: {
        'x-version': 'v2',
      },
    }
  )
  return priceModelResponse.status === 204
}

export const deletePriceModel = async (
  tenant: string,
  priceModelId: string,
  forceDelete: boolean
): Promise<void> => {
  await api.delete(`price/${tenant}/priceModels/${priceModelId}`, {
    params: {
      forceDelete,
    },
    headers: {
      'x-version': 'v2',
    },
  })
}

export const usePriceModelsApi = () => {
  const { tenant } = useDashboardContext()

  const getPriceModelsPaginated = useCallback(
    async (
      pagination: Partial<PaginationProps>
    ): Promise<PaginatedResponse<PriceModel>> => {
      if (tenant) {
        return getPriceModels(tenant, pagination)
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
