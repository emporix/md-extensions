import { useCallback } from 'react'
import {
  getSchemasCall,
  getSchemaCall,
  getReferencesCall,
  getReferenceCall,
  getMixinsSchemaCall,
} from '@emporix/api-calls'
import { Reference, Schema } from '../../models/Schema.model'
import { MixinsSchema } from '../../models/Mixins.model'
import { useDashboardContext } from '../../context/Dashboard.context'

/**
 * Read-only slice of the schema API — the Returns detail page only renders
 * mixin forms, it never authors schemas.
 */
export const useSchemaApi = () => {
  const { tenant } = useDashboardContext()

  const getSchemas = useCallback(
    (type: string): Promise<Schema[]> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      if (!type) {
        return Promise.reject(new Error('No type provided'))
      }
      return getSchemasCall(tenant, type) as unknown as Promise<Schema[]>
    },
    [tenant]
  )

  const getSchema = useCallback(
    (id: string, version: number): Promise<Schema> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      if (!id) {
        return Promise.reject(new Error('No id provided'))
      }
      if (!version) {
        return Promise.reject(new Error('No version provided'))
      }
      return getSchemaCall(tenant, id, version) as unknown as Promise<Schema>
    },
    [tenant]
  )

  const getReferences = useCallback(
    (type: string): Promise<Reference[]> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      if (!type) {
        return Promise.reject(new Error('No type provided'))
      }
      return getReferencesCall(tenant, type) as unknown as Promise<Reference[]>
    },
    [tenant]
  )

  const getReference = useCallback(
    (id: string, version: number): Promise<Reference> => {
      if (!tenant) {
        return Promise.reject(new Error('No tenant'))
      }
      if (!id) {
        return Promise.reject(new Error('No id provided'))
      }
      if (!version) {
        return Promise.reject(new Error('No version provided'))
      }
      return getReferenceCall(
        tenant,
        id,
        version
      ) as unknown as Promise<Reference>
    },
    [tenant]
  )

  return { getSchemas, getSchema, getReferences, getReference }
}

export const useMixinsApi = () => {
  const getMixinsSchema = useCallback(
    (url: string): Promise<MixinsSchema> =>
      getMixinsSchemaCall(url) as Promise<MixinsSchema>,
    []
  )

  return { getMixinsSchema }
}
