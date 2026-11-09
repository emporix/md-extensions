import { useCallback } from 'react'
import {
  createContactFlow,
  createLegalEntityCall,
  createLocationCall,
  deleteContactAssignmentCall,
  deleteContactcall,
  deleteLegalEntityCall,
  deleteLocationCall,
  fetchContactAssignmentCall,
  fetchContactAssignmentsCall,
  fetchContactsCall,
  fetchContactsForEntityCall,
  fetchLegalEntitiesCall,
  fetchLegalEntityCall,
  fetchLocationCall,
  getLocations,
  updateContactFlow,
  updateLegalEntityCall,
  updateLocationCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../usePagination'
import { apiPagination, toApiPagination } from '../../helpers/apiPagination'
import {
  ApprovalGroup,
  ContactAssignment,
  LegalEntity,
  Location,
} from '../../models/LegalEntity.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import { fetchAllRecords } from '../../helpers/paginationUtils'

export const useCustomerManagementApi = () => {
  const { tenant } = useDashboardContext()

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
        return fetchLegalEntitiesCall(tenant, toApiPagination(pagination), {
          withContacts,
        })
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getAllLegalEntities = useCallback(
    (pagination?: Partial<PaginationProps>): Promise<LegalEntity[]> =>
      fetchAllRecords((p) => getLegalEntities(p, false), {
        currentPage: 1,
        rows: 100,
        ...pagination,
      }),
    [getLegalEntities]
  )

  const getContacts = useCallback(
    (pagination: Partial<PaginationProps>) => {
      if (tenant) {
        return fetchContactsCall(tenant, toApiPagination(pagination))
      } else {
        return Promise.reject('no tenant')
      }
    },
    [tenant]
  )

  const getContactsAssignments = useCallback(
    (pagination: Partial<PaginationProps>, params?: Record<string, string>) => {
      if (tenant) {
        return fetchContactAssignmentsCall(
          tenant,
          toApiPagination(pagination),
          params
        )
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
      pagination: Partial<PaginationProps> = apiPagination({ rows: 60 })
    ) => {
      if (tenant) {
        return getLocations(tenant, toApiPagination(pagination), locationIds)
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
      const approvalContacts: { id: string }[] = [
        ...contactsToBeAdded,
        ...(legalEntity.approvalGroup ?? []),
      ]
      const newApprovalGroup = approvalContacts.map((approvalContact) => ({
        id: approvalContact.id,
      }))

      await updateLegalEntity({
        ...legalEntity,
        approvalGroup: newApprovalGroup,
      })
    },
    [updateLegalEntity]
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
    [updateLegalEntity]
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
    getAllLegalEntities,
    getLegalEntity,
  }
}
