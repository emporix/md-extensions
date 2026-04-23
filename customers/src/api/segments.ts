import { useCallback } from 'react'
import { api, MultiStatusResponse } from '.'
import { useTenant } from '../context/TenantProvider'
import { PaginationProps } from '../hooks/usePagination'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
  formatPaginationParamsForSorting,
} from '../helpers/params'
import { Segment, SegmentItem, SegmentMember } from '../models/Segment'
import { Metadata } from '../models/Metadata'
import { fetchAllRecords } from '../helpers/paginationUtils'

const getSegmentsCall = async (
  tenant: string,
  paginationProps: Partial<PaginationProps>,
  siteCode?: string,
  params?: Record<string, string>
) => {
  const config = {
    params: {
      ...formatPaginationParamsForEmporixPagination(paginationProps),
      q: formatFilterQuery(paginationProps.filters),
      sort: formatPaginationParamsForSorting(paginationProps),
      ...params,
    },
    headers: {
      'X-Total-Count': true,
    },
  }
  if (siteCode) {
    config.params.q += ` siteCode:${siteCode}`
  }
  const { data, headers } = await api.get<Segment[]>(
    `/customer-segment/${tenant}/segments`,
    config
  )
  return { segments: data, totalRecords: +headers['x-total-count'] }
}

const getSegmentByIdCall = async (tenant: string, id: string) => {
  const { data } = await api.get<Segment>(
    `/customer-segment/${tenant}/segments/${id}`
  )
  return data
}

const deleteSegmentCall = async (tenant: string, id: string, force = false) => {
  await api.delete(`/customer-segment/${tenant}/segments/${id}`, {
    params: {
      forceDelete: force,
    },
  })
}

const deleteSegmentsCall = async (tenant: string, ids: string[]) => {
  const { data } = await api.delete<MultiStatusResponse[]>(
    `/customer-segment/${tenant}/segments/bulk`,
    { data: ids }
  )
  return data
}

const createSegmentCall = async (tenant: string, segment: Partial<Segment>) => {
  const { data } = await api.post<{ id: string }>(
    `/customer-segment/${tenant}/segments`,
    segment
  )
  return data.id
}

const editSegmentCall = async (tenant: string, segment: Partial<Segment>) => {
  await api.put(`/customer-segment/${tenant}/segments/${segment.id}`, segment)
}

const getSegmentMembersCall = async (
  tenant: string,
  paginationProps: Partial<PaginationProps>,
  segmentId: string
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
  const { data, headers } = await api.get<SegmentMember[]>(
    `/customer-segment/${tenant}/segments/${segmentId}/customers`,
    config
  )
  return { customersAssignments: data, totalRecords: +headers['x-total-count'] }
}

const addB2bMemberToSegmentCall = async (
  tenant: string,
  segmentId: string,
  customerId: string,
  legalEntityId: string
) => {
  await api.put(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/${customerId}/${legalEntityId}`,
    {}
  )
}

const addB2cMemberToSegmentCall = async (
  tenant: string,
  segmentId: string,
  customerId: string
) => {
  await api.put(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/${customerId}`,
    {}
  )
}

const deleteB2bMemberFromSegmentCall = async (
  tenant: string,
  segmentId: string,
  customerId: string,
  legalEntityId: string
) => {
  await api.delete(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/${customerId}/${legalEntityId}`
  )
}

const deleteB2cMemberFromSegmentCall = async (
  tenant: string,
  segmentId: string,
  customerId: string
) => {
  await api.delete(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/${customerId}`
  )
}

const addMembersToSegmentCall = async (
  tenant: string,
  segmentId: string,
  customers: {
    customerId: string
    legalEntityId: string
    metadata?: Metadata
  }[]
) => {
  await api.put(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/bulk`,
    customers
  )
}

const deleteMembersFromSegmentCall = async (
  tenant: string,
  segmentId: string,
  customers: {
    customerId: string
    legalEntityId: string
  }[]
) => {
  const { data } = await api.delete<MultiStatusResponse[]>(
    `/customer-segment/${tenant}/segments/${segmentId}/customers/bulk`,
    { data: customers }
  )
  return data
}

const getSegmentItemsCall = async (
  segmentId: string,
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
  const { data, headers } = await api.get<SegmentItem[]>(
    `/customer-segment/${tenant}/segments/${segmentId}/items`,
    config
  )
  return { assignments: data, totalRecords: +headers['x-total-count'] }
}

const assignObjectToSegmentCall = async (
  tenant: string,
  segmentId: string,
  type: string,
  itemId: string
) => {
  await api.put(
    `/customer-segment/${tenant}/segments/${segmentId}/items/${type}/${itemId}`,
    {}
  )
}

const assignObjectsToSegmentCall = async (
  tenant: string,
  segmentId: string,
  type: string,
  items: { id: string }[]
) => {
  const { data } = await api.put<MultiStatusResponse[]>(
    `/customer-segment/${tenant}/segments/${segmentId}/items/${type}/bulk`,
    items
  )
  return data
}

const unassignObjectsFromSegmentCall = async (
  tenant: string,
  segmentId: string,
  type: string,
  itemIds: string[]
) => {
  const { data } = await api.delete<MultiStatusResponse[]>(
    `/customer-segment/${tenant}/segments/${segmentId}/items/${type}/bulk`,
    { data: itemIds }
  )
  return data
}

export const useSegmentsApi = () => {
  const { tenant } = useTenant()

  const getSegments = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      siteCode?: string,
      params?: Record<string, string>
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getSegmentsCall(tenant, paginationParams, siteCode, params)
    },
    [tenant]
  )

  const getAllSegments = useCallback(
    (
      pagination?: Partial<PaginationProps>,
      siteCode?: string,
      params?: Record<string, string>
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      const initialPagination: Partial<PaginationProps> = {
        currentPage: 1,
        rows: 100,
      }
      const fetchPage = async (pagination: Partial<PaginationProps>) => {
        const { segments, totalRecords } = await getSegmentsCall(
          tenant,
          { ...initialPagination, ...pagination },
          siteCode,
          params
        )
        return {
          values: segments,
          totalRecords,
        }
      }
      return fetchAllRecords(fetchPage, pagination)
    },
    [tenant]
  )

  const getSegmentById = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getSegmentByIdCall(tenant, id)
    },
    [tenant]
  )

  const deleteSegment = useCallback(
    (id: string, force?: boolean) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteSegmentCall(tenant, id, force)
    },
    [tenant]
  )

  const deleteSegments = useCallback(
    (ids: string[]) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteSegmentsCall(tenant, ids)
    },
    [tenant]
  )

  const createSegment = useCallback(
    (segment: Partial<Segment>) => {
      return createSegmentCall(tenant, segment)
    },
    [tenant]
  )

  const editSegment = useCallback(
    (segment: Partial<Segment>) => {
      return editSegmentCall(tenant, segment)
    },
    [tenant]
  )

  const getSegmentMembers = useCallback(
    (paginationParams: Partial<PaginationProps>, segmentId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getSegmentMembersCall(tenant, paginationParams, segmentId)
    },
    [tenant]
  )

  const addMemberToSegment = useCallback(
    (segmentId: string, customerId: string, legalEntityId?: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      if (legalEntityId) {
        return addB2bMemberToSegmentCall(
          tenant,
          segmentId,
          customerId,
          legalEntityId
        )
      } else {
        return addB2cMemberToSegmentCall(tenant, segmentId, customerId)
      }
    },
    [tenant]
  )

  const deleteMemberFromSegment = useCallback(
    (segmentId: string, customerId: string, legalEntityId?: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      if (legalEntityId) {
        return deleteB2bMemberFromSegmentCall(
          tenant,
          segmentId,
          customerId,
          legalEntityId
        )
      } else {
        return deleteB2cMemberFromSegmentCall(tenant, segmentId, customerId)
      }
    },
    [tenant]
  )

  const addMembersToSegment = useCallback(
    (
      segmentId: string,
      customers: {
        customerId: string
        legalEntityId: string
        metadata?: Metadata
      }[]
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return addMembersToSegmentCall(tenant, segmentId, customers)
    },
    [tenant]
  )

  const deleteMembersFromSegment = useCallback(
    (
      segmentId: string,
      customers: { customerId: string; legalEntityId: string }[]
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteMembersFromSegmentCall(tenant, segmentId, customers)
    },
    [tenant]
  )

  const getSegmentItems = useCallback(
    (segmentId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return fetchAllSegmentItems(tenant, segmentId)
    },
    [tenant]
  )

  const fetchAllSegmentItems = useCallback(
    (
      tenant: string,
      segmentId: string,
      initialPagination: Partial<PaginationProps> = {
        currentPage: 1,
        rows: 100,
      }
    ): Promise<SegmentItem[]> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant provided'))
      }

      const fetchPage = async (pagination: Partial<PaginationProps>) => {
        const { assignments, totalRecords } = await getSegmentItemsCall(
          segmentId,
          tenant,
          pagination
        )
        return {
          values: assignments,
          totalRecords,
        }
      }

      return fetchAllRecords(fetchPage, initialPagination)
    },
    [tenant]
  )

  const assignObjectToSegment = useCallback(
    (segmentId: string, type: string, itemId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return assignObjectToSegmentCall(tenant, segmentId, type, itemId)
    },
    [tenant]
  )

  const assignObjectsToSegment = useCallback(
    (segmentId: string, type: string, items: { id: string }[]) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return assignObjectsToSegmentCall(tenant, segmentId, type, items)
    },
    [tenant]
  )

  const unassignObjectsFromSegment = useCallback(
    (segmentId: string, type: string, itemIds: string[]) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return unassignObjectsFromSegmentCall(tenant, segmentId, type, itemIds)
    },
    [tenant]
  )

  return {
    getSegments,
    getAllSegments,
    getSegmentById,
    deleteSegment,
    deleteSegments,
    createSegment,
    editSegment,
    getSegmentMembers,
    addMemberToSegment,
    deleteMemberFromSegment,
    addMembersToSegment,
    deleteMembersFromSegment,
    getSegmentItems,
    fetchAllSegmentItems,
    assignObjectToSegment,
    assignObjectsToSegment,
    unassignObjectsFromSegment,
  }
}
