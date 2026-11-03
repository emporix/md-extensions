import { useCallback } from 'react'
import { Reference, Schema } from '../../models/Schema.model'
import { useDashboardContext } from '../../context/Dashboard.context'
import {
  getReferenceCall,
  getReferencesCall,
  getSchemaCall,
  getSchemasCall,
} from '@emporix/api-calls'

/** Lean port of MD `hooks/api/schema` — read calls used by mixins and mixin columns. */
export const useSchemaApi = () => {
  const { tenant } = useDashboardContext()

  const getReferences = useCallback(
    (type: string): Promise<Reference[]> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!type) {
        return Promise.reject('No type provided')
      }
      return getReferencesCall(tenant, type)
    },
    [tenant]
  )

  const getReference = useCallback(
    (id: string, version: number): Promise<Reference> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      if (!version) {
        return Promise.reject('No version provided')
      }
      return getReferenceCall(tenant, id, version)
    },
    [tenant]
  )

  const getSchemas = useCallback(
    (type: string): Promise<Schema[]> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!type) {
        return Promise.reject('No type provided')
      }
      return getSchemasCall(tenant, type)
    },
    [tenant]
  )

  const getSchema = useCallback(
    (id: string, version: number): Promise<Schema> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      if (!version) {
        return Promise.reject('No version provided')
      }
      return getSchemaCall(tenant, id, version)
    },
    [tenant]
  )

  return {
    getReferences,
    getReference,
    getSchemas,
    getSchema,
  }
}
