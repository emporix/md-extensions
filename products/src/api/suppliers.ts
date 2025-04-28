import { useCallback } from 'react'
import { api } from '.'
import { Supplier } from '../models/Suppliers'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

const fetchSuppliersCall = async (): Promise<Supplier[]> => {
  const { data } = await api.get(`/supplier/suppliers`)
  return data
}

const fetchSupplierById = async (id: string) => {
  const { data } = await api.get(`/supplier/suppliers/${id}`)
  return data
}

const createSupplierCall = async (_tenant: string, supplier: Supplier) => {
  const { data } = await api.post(`/supplier/suppliers`, supplier)
  return data.id
}

const editSupplierByIdCall = async (
  _tenant: string,
  id: string,
  payload: Supplier
) => {
  return await api.put(`/supplier/suppliers/${id}`, payload)
}

const deleteSupplierCall = async (_tenant: string, id: string) => {
  return await api.delete(`/supplier/suppliers/${id}`)
}

const getProductSuppliersCall = async (productId: string, siteCode: string) => {
  const { data } = await api.get(
    `/supplier/PSRelations/${productId}/${siteCode}`
  )
  return data[0].suppliers
}

const editProductSupplierCall = async (
  productId: string,
  siteCode: string,
  suppliers: Partial<Supplier>[]
) => {
  await api.put(`/supplier/PSRelations/${productId}/${siteCode}`, {
    productId,
    siteCode,
    suppliers,
  })
}

export const useSuppliersApi = () => {
  const { tenant } = useDashboardContext()

  const getSuppliers = useCallback(() => {
    if (!tenant) {
      return Promise.reject('no config')
    }
    return fetchSuppliersCall()
  }, [tenant])

  const getSuppliersById = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return fetchSupplierById(id)
    },
    [tenant]
  )

  const createSupplier = useCallback(
    (supplier: Supplier) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return createSupplierCall(tenant, supplier)
    },
    [tenant]
  )

  const deleteSupplier = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return deleteSupplierCall(tenant, id)
    },
    [tenant]
  )

  const editSupplierById = useCallback(
    (id: string, payload: Supplier) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return editSupplierByIdCall(tenant, id, payload)
    },
    [tenant]
  )

  const getSuppliersRelatedToProduct = useCallback(
    (productId: string, siteCode: string) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return getProductSuppliersCall(productId, siteCode)
    },
    [tenant]
  )

  const editSuppliersRelatedToProduct = useCallback(
    (productId: string, siteCode: string, payload: Partial<Supplier>[]) => {
      if (!tenant) {
        return Promise.reject('no config')
      }
      return editProductSupplierCall(productId, siteCode, payload)
    },
    [tenant]
  )

  return {
    getSuppliers,
    getSuppliersById,
    createSupplier,
    editSupplierById,
    deleteSupplier,
    getSuppliersRelatedToProduct,
    editSuppliersRelatedToProduct,
  }
}
