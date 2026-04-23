import { useCallback } from 'react'
import { api } from '.'
import { PaginationProps } from '../hooks/usePagination'
import { PaginatedResponse } from './orders'
import {
  ApprovalGroup,
  Contact,
  ContactAssignment,
  ContactType,
  LegalEntity,
  Location,
} from '../models/LegalEntity'
import {
  formatFilterQuery,
  formatPaginationParamsForEmporixPagination,
} from '../helpers/params'
import { AxiosResponse } from 'axios'
import { useTenant } from '../context/TenantProvider'

export const fetchContactsForEntityCall = async (
  tenant: string,
  legalEntityId: string,
  type?: ContactType
) => {
  const contactAssignmentsResponse = await api.get<ContactAssignment[]>(
    `/customer-management/${tenant}/contact-assignments`,
    {
      params: {
        pageSize: 100,
        'legalEntity.id': legalEntityId,
        type,
      },
    }
  )

  return contactAssignmentsResponse.data
}

export const fetchLegalEntityCall = async (
  tenant: string,
  legalEntityId: string
): Promise<LegalEntity> => {
  const legalEntityResponse = await api.get<LegalEntity>(
    `/customer-management/${tenant}/legal-entities/${legalEntityId}`,
    {
      headers: {
        'X-Total-Count': true,
      },
    }
  )

  let legalEntity = legalEntityResponse.data
  const contacts = await fetchContactsForEntityCall(tenant, legalEntityId)
  legalEntity = { ...legalEntity, contacts: contacts }
  return legalEntity
}

export const updateLegalEntityCall = async (
  tenant: string,
  legalEntity: Partial<LegalEntity>
) => {
  return await api.put(
    `/customer-management/${tenant}/legal-entities/${legalEntity.id}`,
    { ...legalEntity }
  )
}

export const deleteLocationCall = async (
  tenant: string,
  locationId: string
) => {
  return await api.delete(
    `/customer-management/${tenant}/locations/${locationId}`
  )
}

export const deleteLegalEntityCall = async (
  tenant: string,
  legalEntityId: string
) => {
  return await api.delete(
    `/customer-management/${tenant}/legal-entities/${legalEntityId}`
  )
}

export const updateLocationCall = async (
  tenant: string,
  location: Partial<Location>
) => {
  return await api.put<Location>(
    `/customer-management/${tenant}/locations/${location.id}`,
    { ...location }
  )
}

export const createLegalEntityCall = async (
  tenant: string,
  legalEntity: Partial<LegalEntity>
): Promise<AxiosResponse> => {
  return await api.post(`/customer-management/${tenant}/legal-entities`, {
    ...legalEntity,
  })
}

export const createLocationCall = async (
  tenant: string,
  legalEntityId: string,
  location: Partial<Location>
): Promise<string> => {
  const { data } = await api.post<Location>(
    `/customer-management/${tenant}/locations/`,
    {
      ...location,
    }
  )
  const legalEntity = await fetchLegalEntityCall(tenant, legalEntityId)

  let newEntitiesAddresses = [data]
  if (legalEntity.entitiesAddresses) {
    newEntitiesAddresses = [
      ...newEntitiesAddresses,
      ...legalEntity.entitiesAddresses,
    ]
  }
  const legalEntityWithNewLocation: LegalEntity = {
    ...legalEntity,
    entitiesAddresses: [...newEntitiesAddresses],
  }
  await updateLegalEntityCall(tenant, legalEntityWithNewLocation)
  return data.id ? data.id : '-1'
}

export const fetchLocationCall = async (
  tenant: string,
  locationId: string
): Promise<Location> => {
  const legalEntityResponse = await api.get<Location>(
    `/customer-management/${tenant}/locations/${locationId}`
  )

  return legalEntityResponse.data
}

export const getLocations = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  locationIds: string[]
): Promise<any> => {
  const legalEntityResponse = await api.get<Location[]>(
    `/customer-management/${tenant}/locations/`,
    {
      params: {
        ...formatPaginationParamsForEmporixPagination(pagination),
        q: locationIds && `id:(${locationIds.join(',')})`,
      },
      headers: {
        'X-Total-Count': true,
      },
    }
  )

  return legalEntityResponse.data
}

export const fetchLegalEntitiesCall = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  paramsData?: {
    parentId?: string
    withContacts?: boolean
  }
): Promise<PaginatedResponse<LegalEntity>> => {
  const legalEntitiesResponse = await api.get<LegalEntity[]>(
    `/customer-management/${tenant}/legal-entities`,
    {
      params: {
        pageSize: pagination.rows,
        pageNumber: pagination.currentPage,
        parentId: paramsData?.parentId,
        sort: pagination.sortField
          ? `${pagination.sortField}:` +
            (pagination.sortOrder == 1 ? 'desc' : 'asc')
          : '',
        q: formatFilterQuery(pagination.filters),
      },
      headers: {
        'X-Total-Count': true,
      },
    }
  )
  const legalEntities = legalEntitiesResponse.data
  if (paramsData?.withContacts) {
    const requests = legalEntities.map((legalEntity) =>
      fetchContactsForEntityCall(tenant, legalEntity.id)
    )
    const responses = await Promise.all(requests)
    for (let i = 0; i < legalEntities.length; i++) {
      const contacts = responses[i]
      legalEntities[i] = { ...legalEntities[i], contacts }
    }
  }

  return {
    values: legalEntities,
    totalRecords: parseInt(legalEntitiesResponse.headers['x-total-count']),
  }
}
export const fetchContactsCall = async (
  tenant: string,
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Contact>> => {
  const legalEntitiesResponse = await api.get<Contact[]>(
    `/customer-management/${tenant}/contacts`,
    {
      params: {
        pageSize: pagination.rows,
        pageNumber: pagination.currentPage,
      },
      headers: {
        'X-Total-Count': true,
      },
    }
  )

  return {
    values: legalEntitiesResponse.data,
    totalRecords: parseInt(legalEntitiesResponse.headers['X-Total-Count']),
  }
}

export const fetchContactAssignmentsCall = async (
  tenant: string,
  pagination: Partial<PaginationProps>,
  params?: Record<string, string>
): Promise<PaginatedResponse<ContactAssignment>> => {
  const legalEntitiesResponse = await api.get<ContactAssignment[]>(
    `/customer-management/${tenant}/contact-assignments`,
    {
      params: {
        pageSize: pagination.rows,
        pageNumber: pagination.currentPage,
        ...params,
      },
      headers: {
        'X-Total-Count': true,
      },
    }
  )

  return {
    values: legalEntitiesResponse.data,
    totalRecords: parseInt(legalEntitiesResponse.headers['x-total-count']),
  }
}

export const fetchContactAssignmentCall = async (
  tenant: string,
  contactAssignmentId: string
): Promise<ContactAssignment> => {
  const legalEntityResponse = await api.get<ContactAssignment>(
    `/customer-management/${tenant}/contact-assignments/${contactAssignmentId}`
  )

  return legalEntityResponse.data
}

export const deleteContactAssignmentCall = async (
  tenant: string,
  contactAssignmentId: string
): Promise<AxiosResponse> => {
  return await api.delete<ContactAssignment>(
    `/customer-management/${tenant}/contact-assignments/${contactAssignmentId}`
  )
}

interface ContactAssignmentUpdateModel {
  id?: string
  legalEntity: {
    id: string
  }
  customer?: {
    id?: string
  }
  type?: ContactType
  primary?: boolean
  metadata?: {
    version: number
  }
}

const deleteContactcall = async (tenant: string, contactId: string) => {
  return await api.delete<ContactAssignment>(
    `/customer-management/${tenant}/contacts/${contactId}`
  )
}

const updateContactAssignmentCall = async (
  tenant: string,
  contactAssignment: ContactAssignmentUpdateModel,
  contactAssignmentId: string
) => {
  return await api.put<ContactAssignment>(
    `/customer-management/${tenant}/contact-assignments/${contactAssignmentId}`,
    contactAssignment
  )
}

const createContactAssignment = async (
  tenant: string,
  contactAssignment: ContactAssignmentUpdateModel
) => {
  const { data } = await api.post<ContactAssignment>(
    `/customer-management/${tenant}/contact-assignments/`,
    contactAssignment
  )
  return data.id
}

const updateContactFlow = async (
  tenant: string,
  contactAssignment: Partial<ContactAssignment>
) => {
  if (
    contactAssignment.id &&
    contactAssignment?.legalEntity?.id &&
    contactAssignment?.customer?.id &&
    contactAssignment.type &&
    contactAssignment?.metadata?.version
  ) {
    const contactAssignmentBody: ContactAssignmentUpdateModel = {
      legalEntity: {
        id: contactAssignment?.legalEntity?.id,
      },
      customer: {
        id: contactAssignment.customer.id,
      },
      type: contactAssignment.type,
      primary: contactAssignment.primary,
      metadata: {
        version: contactAssignment?.metadata?.version,
      },
    }

    return await updateContactAssignmentCall(
      tenant,
      contactAssignmentBody,
      contactAssignment.id
    )
  }
}

const createContactFlow = async (
  tenant: string,
  contactAssignment: Partial<ContactAssignment>
) => {
  const contactAssignmentBody: ContactAssignmentUpdateModel = {
    id: contactAssignment?.id,
    legalEntity: {
      id: contactAssignment?.legalEntity?.id,
    },
    customer: {
      id: contactAssignment?.customer?.id,
    },
    type: contactAssignment.type,
    primary: contactAssignment.primary,
  }

  return await createContactAssignment(tenant, contactAssignmentBody)
}

export const useCustomerManagementApi = () => {
  const { tenant } = useTenant()

  const getSubsidiaries = useCallback(
    (parentId: string, withContacts: boolean) => {
      if (tenant) {
        return fetchLegalEntitiesCall(
          tenant,
          { rows: 100 },
          { parentId, withContacts }
        )
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getLegalEntities = useCallback(
    (pagination: Partial<PaginationProps>, withContacts = true) => {
      if (tenant) {
        return fetchLegalEntitiesCall(tenant, pagination, {
          withContacts,
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getContacts = useCallback(
    (pagination: Partial<PaginationProps>) => {
      if (tenant) {
        return fetchContactsCall(tenant, pagination)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getContactsAssignments = useCallback(
    (pagination: Partial<PaginationProps>, params?: Record<string, string>) => {
      if (tenant) {
        return fetchContactAssignmentsCall(tenant, pagination, params)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getContactAssignment = useCallback(
    (contactAssignmentId: string) => {
      if (tenant) {
        return fetchContactAssignmentCall(tenant, contactAssignmentId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteContactAssignment = useCallback(
    (contactAssignmentId: string) => {
      if (tenant) {
        return deleteContactAssignmentCall(tenant, contactAssignmentId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateLocation = useCallback(
    (location: Partial<Location>) => {
      if (tenant) {
        return updateLocationCall(tenant, location)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createLocation = useCallback(
    (legalEntityId: string, location: Partial<Location>) => {
      if (tenant) {
        return createLocationCall(tenant, legalEntityId, location)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createContactWithAssignment = useCallback(
    (contactAssignment: Partial<ContactAssignment>) => {
      if (tenant) {
        return createContactFlow(tenant, contactAssignment)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteLocation = useCallback(
    (locationId: string) => {
      if (tenant) {
        return deleteLocationCall(tenant, locationId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteContact = useCallback(
    (contactId: string) => {
      if (tenant) {
        return deleteContactcall(tenant, contactId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const deleteLegalEntity = useCallback(
    (legalEntityId: string) => {
      if (tenant) {
        return deleteLegalEntityCall(tenant, legalEntityId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getLegalEntity = useCallback(
    (legalEntityId: string) => {
      if (tenant) {
        return fetchLegalEntityCall(tenant, legalEntityId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getLocation = useCallback(
    (locationId: string) => {
      if (tenant) {
        return fetchLocationCall(tenant, locationId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getLocationsForEntity = useCallback(
    (
      locationIds: string[],
      pagination: Partial<PaginationProps> = { rows: 60 }
    ) => {
      if (tenant) {
        return getLocations(tenant, pagination, locationIds)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getContactsForEntity = useCallback(
    (legalEntityId: string) => {
      if (tenant) {
        return fetchContactsForEntityCall(tenant, legalEntityId)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateContactWithAssignment = useCallback(
    (contactAssignment: Partial<ContactAssignment>) => {
      if (tenant) {
        return updateContactFlow(tenant, contactAssignment)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const updateLegalEntity = useCallback(
    (legalEntity: Partial<LegalEntity>) => {
      if (tenant) {
        return updateLegalEntityCall(tenant, legalEntity)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const createLegalEntity = useCallback(
    (legalEntity: Partial<LegalEntity>) => {
      if (tenant) {
        return createLegalEntityCall(tenant, legalEntity)
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const addApprovalGroupContact = useCallback(
    async (
      legalEntity: Partial<LegalEntity>,
      contactsToBeAdded: ContactAssignment[] | ApprovalGroup[]
    ) => {
      let approvalContacts: any = []
      if (legalEntity.approvalGroup) {
        approvalContacts = [...legalEntity.approvalGroup]
      }

      approvalContacts = [...contactsToBeAdded, ...approvalContacts]
      const newApprovalGroup = [
        ...approvalContacts.map((approvalContact: any) => ({
          id: approvalContact.id,
        })),
      ]

      await updateLegalEntity({
        ...legalEntity,
        approvalGroup: newApprovalGroup,
      })
    },
    [tenant]
  )

  const removeApprovalGroupContact = useCallback(
    async (
      legalEntity: Partial<LegalEntity>,
      contactsIdsToBeRemoved: string[]
    ) => {
      if (legalEntity.approvalGroup && legalEntity.approvalGroup.length > 0) {
        let approvalGroup = [...legalEntity.approvalGroup]
        approvalGroup = approvalGroup.filter(
          (contactAssignment) =>
            !contactsIdsToBeRemoved.includes(contactAssignment.id)
        )
        await updateLegalEntity({
          ...legalEntity,
          approvalGroup,
        })
      }
    },
    [tenant]
  )

  return {
    addApprovalGroupContact,
    removeApprovalGroupContact,
    createLegalEntity,
    updateLegalEntity,
    deleteLegalEntity,
    updateContactWithAssignment,
    deleteContact,
    getContactAssignment,
    getContactsAssignments,
    getContacts,
    createContactWithAssignment,
    deleteContactAssignment,
    deleteLocation,
    createLocation,
    updateLocation,
    getLocation,
    getContactsForEntity,
    getSubsidiaries,
    getLocationsForEntity,
    getLegalEntities,
    getLegalEntity,
  }
}
