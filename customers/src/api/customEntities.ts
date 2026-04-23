import { api } from './index'
import { useCallback } from 'react'
import { CustomEntity } from '../models/CustomEntity'
import { useTenant } from '../context/TenantProvider'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'

export const getCustomEntitiesCall = async (
  tenant: string,
  paginationProps: Partial<PaginationProps>
) => {
  const config = {
    params: {
      ...formatPaginationParamsForEmporixPagination(paginationProps),
      q: formatFilterQuery(paginationProps.filters),
      sort: formatPaginationParamsForSorting(paginationProps),
    },
    headers: {
      'X-Total-Count': true,
    },
  }

  const { data, headers } = await api.get<CustomEntity[]>(
    `schema/${tenant}/custom-entities`,
    config
  )
  return { customEntities: data, totalRecords: +headers['x-total-count'] }
}

export const getCustomEntityByIdCall = async (
  tenant: string,
  id: string
): Promise<CustomEntity> => {
  const { data } = await api.get(`schema/${tenant}/custom-entities/${id}`)
  return data
}

export const upsertCustomEntityCall = async (
  tenant: string,
  body: Partial<CustomEntity>
): Promise<unknown> => {
  return api.put(`schema/${tenant}/custom-entities/${body.id}`, {
    ...body,
  })
}

export const deleteCustomEntityCall = async (
  tenant: string,
  id: string
): Promise<unknown> => {
  return api.delete(`schema/${tenant}/custom-entities/${id}`)
}

export const postCustomEntityCall = async (
  tenant: string,
  body: Partial<CustomEntity>
): Promise<string> => {
  const { data } = await api.post(`schema/${tenant}/custom-entities`, {
    ...body,
  })
  return data.id
}

export const useCustomEntitiesApi = () => {
  const { tenant } = useTenant()

  const getCustomEntities = useCallback(
    (paginationParams: Partial<PaginationProps>) => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      return getCustomEntitiesCall(tenant, paginationParams)
    },
    [tenant]
  )

  const getCustomEntityById = useCallback(
    (id: string): Promise<CustomEntity> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      return getCustomEntityByIdCall(tenant, id)
    },
    [tenant]
  )

  const postCustomEntity = useCallback(
    (customEntity: Partial<CustomEntity>): Promise<string> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!customEntity) {
        return Promise.reject('No body provided')
      }
      return postCustomEntityCall(tenant, customEntity)
    },
    [tenant]
  )

  const upsertCustomEntity = useCallback(
    (customEntity: Partial<CustomEntity>): Promise<unknown> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!customEntity) {
        return Promise.reject('No body provided')
      }
      return upsertCustomEntityCall(tenant, customEntity)
    },
    [tenant]
  )

  const deleteCustomEntity = useCallback(
    (id: string): Promise<unknown> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      return deleteCustomEntityCall(tenant, id)
    },
    [tenant]
  )

  return {
    getCustomEntities,
    getCustomEntityById,
    postCustomEntity,
    upsertCustomEntity,
    deleteCustomEntity,
  }
}
