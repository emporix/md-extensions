import { useCallback } from 'react'
import { api } from '.'
import { Asset, MediaAccess, MediaType, RefId } from '../models/Assets'
import { AxiosProgressEvent } from 'axios'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

export const postFileAsset = async (
  tenant: string,
  file: File,
  onUploadProgress: (e: AxiosProgressEvent) => void,
  refIds: RefId[],
  access: MediaAccess,
  type = MediaType.BLOB
) => {
  const headers = {
    'Content-type': 'multipart/form-data',
  }
  const body = {
    type,
    details: {
      filename: file.name,
      mimeType: file.type,
    },
    access,
    refIds,
  }
  const form = new FormData()
  form.append('file', file)
  form.append('body', JSON.stringify(body))

  const config = {
    headers,
    onUploadProgress,
  }

  return await api.post<{ id: string }>(`/media/${tenant}/assets`, form, config)
}

export const getAssetsForId = async (tenant: string, id: string) => {
  const { data } = await api.get<Asset[]>(
    `/media/${tenant}/assets?q=refIds.id:` + id
  )
  return data
}

export const delAsset = async (tenant: string, assetId: string) => {
  return await api.delete<{ id: string }>(`/media/${tenant}/assets/${assetId}`)
}

export const fetchAsset = async (tenant: string, assetId: string) => {
  const { data } = await api.get<Asset>(`/media/${tenant}/assets/${assetId}`)
  return data
}

export const putAsset = async (tenant: string, file: Blob, asset: Asset) => {
  const body = {
    type: asset.type,
    details: asset.details,
    access: asset.access,
    refIds: asset.refIds,
    metadata: asset.metadata,
  }

  const form = new FormData()
  form.append('file', file)
  form.append('body', JSON.stringify(body))

  return await api.put<any>(`/media/${tenant}/assets/${asset.id}`, form)
}

export const useMediaAssets = () => {
  const { tenant } = useDashboardContext()

  const uploadFileAsset = useCallback(
    (
      file: File,
      onUploadProgress: (e: AxiosProgressEvent) => void,
      refIds: RefId[],
      access = MediaAccess.PUBLIC
    ) => {
      if (tenant) {
        return postFileAsset(tenant, file, onUploadProgress, refIds, access)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const getAllAssetsForId = useCallback(
    (id: string) => {
      if (tenant) {
        return getAssetsForId(tenant, id)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  const deleteAsset = useCallback(
    (assetId: string) => {
      if (tenant) {
        return delAsset(tenant, assetId)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )
  const getAsset = useCallback(
    (assetId: string) => {
      if (tenant) {
        return fetchAsset(tenant, assetId)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )
  const updateAsset = useCallback(
    (file: Blob, asset: Asset) => {
      if (tenant) {
        return putAsset(tenant, file, asset)
      } else {
        return Promise.reject('Missing tenant')
      }
    },
    [tenant]
  )

  return {
    uploadFileAsset,
    getAllAssetsForId,
    deleteAsset,
    getAsset,
    updateAsset,
  }
}
