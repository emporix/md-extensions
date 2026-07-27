import { useCallback } from 'react'
import {
  deleteLocationCall,
  deleteVendorCall,
  getLocationCall,
  getLocationsCall,
  getVendorCall,
  getVendorsCall,
  postLocationCall,
  postVendorCall,
  putLocationCall,
  putVendorCall,
} from '@emporix/api-calls'
import { PaginationProps } from '../../hooks/usePagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import { Location, Vendor } from '../../models/Vendor.model'
import { toApiPagination } from '../../helpers/apiPagination'

export const useVendorsApi = () => {
  const { tenant } = useDashboardContext()

  const getVendors = useCallback(
    (
      paginationParams: Partial<PaginationProps>,
      params?: Record<string, string>
    ) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getVendorsCall(tenant, toApiPagination(paginationParams), params)
    },
    [tenant]
  )

  const getSubsidiaries = useCallback(
    (paginationParams: Partial<PaginationProps>, parentId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getVendorsCall(tenant, toApiPagination(paginationParams), {
        parentId,
      })
    },
    [tenant]
  )

  const getVendor = useCallback(
    (vendorId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getVendorCall(tenant, vendorId)
    },
    [tenant]
  )

  const postVendor = useCallback(
    (vendor: Partial<Vendor>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return postVendorCall(tenant, vendor)
    },
    [tenant]
  )

  const putVendor = useCallback(
    (vendorId: string, vendor: Partial<Vendor>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return putVendorCall(tenant, vendorId, vendor)
    },
    [tenant]
  )

  const deleteVendor = useCallback(
    (vendorId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteVendorCall(tenant, vendorId)
    },
    [tenant]
  )

  const getLocations = useCallback(
    (paginationParams: Partial<PaginationProps>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getLocationsCall(tenant, toApiPagination(paginationParams))
    },
    [tenant]
  )

  const getLocation = useCallback(
    (locationId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getLocationCall(tenant, locationId)
    },
    [tenant]
  )

  const postLocation = useCallback(
    (location: Partial<Location>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return postLocationCall(tenant, location)
    },
    [tenant]
  )

  const putLocation = useCallback(
    (locationId: string, location: Partial<Location>) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return putLocationCall(tenant, locationId, location)
    },
    [tenant]
  )

  const deleteLocation = useCallback(
    (locationId: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteLocationCall(tenant, locationId)
    },
    [tenant]
  )

  return {
    getVendors,
    getSubsidiaries,
    getVendor,
    postVendor,
    putVendor,
    deleteVendor,
    getLocations,
    getLocation,
    postLocation,
    putLocation,
    deleteLocation,
  }
}
