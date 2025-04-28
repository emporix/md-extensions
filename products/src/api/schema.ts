import { api } from './index'
import { useCallback } from 'react'
import { Reference, Schema, UpdateTypesMode } from '../models/Schema'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const getTypesCall = async (tenant: string): Promise<string[]> => {
  const { data } = await api.get<string[]>(`schema/${tenant}/types`)
  return data
}

export const getReferencesCall = async (
  tenant: string,
  type: string
): Promise<Reference[]> => {
  const { data } = await api.get<Reference[]>(
    `schema/${tenant}/references?type=${type}`
  )
  return data
}

export const getReferenceCall = async (
  tenant: string,
  id: string,
  version: number
): Promise<Reference> => {
  const { data } = await api.get<Reference>(
    `schema/${tenant}/references/${id}?version=${version}`
  )
  return data
}

export const getSchemasCall = async (
  tenant: string,
  type: string
): Promise<Schema[]> => {
  const { data } = await api.get<Schema[]>(
    `schema/${tenant}/schemas?type=${type}`
  )
  return data
}

export const getSchemaCall = async (
  tenant: string,
  id: string,
  version: number
): Promise<Schema> => {
  const { data } = await api.get<Schema>(
    `schema/${tenant}/schemas/${id}?version=${version}`
  )
  return data
}

export const putSchemaCall = async (
  tenant: string,
  id: string,
  body: Schema
): Promise<unknown> => {
  return await api.put(`schema/${tenant}/schemas/${id}`, {
    ...body,
  })
}

export const putSchemaTypesCall = async (
  tenant: string,
  id: string,
  version: number,
  body: string[],
  mode: UpdateTypesMode
): Promise<unknown> => {
  return await api.put(
    `schema/${tenant}/schemas/${id}/types?version=${version}&mode=${mode}`,
    body
  )
}

export const postSchemaCall = async (
  tenant: string,
  body: Schema
): Promise<unknown> => {
  return await api.post(`schema/${tenant}/schemas`, {
    ...body,
  })
}

export const postProvideFileCall = async (
  tenant: string,
  body: File
): Promise<Schema> => {
  const form = new FormData()
  form.append('file', body)

  const { data } = await api.post<Schema>(
    `schema/${tenant}/schemas/file`,
    form,
    {
      headers: {
        'Content-type': 'multipart/form-data',
      },
    }
  )

  return data
}

export const useSchemaApi = () => {
  const { tenant } = useDashboardContext()

  const getTypes = useCallback((): Promise<string[]> => {
    if (tenant) {
      return getTypesCall(tenant)
    } else {
      return Promise.reject('No tenant provided')
    }
  }, [tenant])

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

  const putSchema = useCallback(
    (id: string, schema: Schema): Promise<unknown> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      if (!schema) {
        return Promise.reject('No body provided')
      }
      return putSchemaCall(tenant, id, schema)
    },
    [tenant]
  )

  const putSchemaTypes = useCallback(
    (
      id: string,
      version: number,
      body: string[],
      mode: UpdateTypesMode
    ): Promise<unknown> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!id) {
        return Promise.reject('No id provided')
      }
      if (!version) {
        return Promise.reject('No version provided')
      }
      if (!body) {
        return Promise.reject('No body provided')
      }
      return putSchemaTypesCall(
        tenant,
        id,
        version,
        body,
        mode ?? UpdateTypesMode.REPLACE
      )
    },
    [tenant]
  )

  const postSchema = useCallback(
    (schema: Schema): Promise<unknown> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!schema) {
        return Promise.reject('No body provided')
      }
      return postSchemaCall(tenant, schema)
    },
    [tenant]
  )

  const postProvideFile = useCallback(
    (body: File): Promise<Schema> => {
      if (!tenant) {
        return Promise.reject('No tenant provided')
      }
      if (!body) {
        return Promise.reject('No body provided')
      }
      return postProvideFileCall(tenant, body)
    },
    [tenant]
  )

  return {
    getReferences,
    getReference,
    getSchemas,
    getSchema,
    getTypes,
    putSchema,
    putSchemaTypes,
    postSchema,
    postProvideFile,
  }
}
