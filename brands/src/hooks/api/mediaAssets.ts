import { useCallback } from 'react'
import {
  delAsset,
  downloadAsset,
  fetchAsset,
  getAssetsForId,
  postFileAsset,
  putAsset,
} from '@emporix/api-calls'
import type { AxiosProgressEvent } from 'axios'
import { MediaAccess, type Asset, type RefId } from '../../models/Assets.model'
import { useDashboardContext } from '../../context/Dashboard.context'

export const useMediaAssets = () => {
  // Ported from management-dashboard, where this read useTenant(); in the
  // remote the tenant comes from the host-provided appState.
  const { tenant } = useDashboardContext()

  const uploadFileAsset = useCallback(
    (
      file: File,
      onUploadProgress: (e: AxiosProgressEvent) => void,
      refIds: RefId[],
      access = MediaAccess.PUBLIC
    ) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return postFileAsset(tenant, file, onUploadProgress, refIds, access)
    },
    [tenant]
  )

  const getAllAssetsForId = useCallback(
    (id: string) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return getAssetsForId(tenant, id)
    },
    [tenant]
  )

  const deleteAsset = useCallback(
    (assetId: string) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return delAsset(tenant, assetId)
    },
    [tenant]
  )

  const getAsset = useCallback(
    (assetId: string) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return fetchAsset(tenant, assetId)
    },
    [tenant]
  )

  const updateAsset = useCallback(
    (file: Blob, asset: Asset) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return putAsset(tenant, file, asset)
    },
    [tenant]
  )

  const downloadAssetFile = useCallback(
    (assetId: string) => {
      if (!tenant) {
        return Promise.reject(new Error('Missing tenant'))
      }
      return downloadAsset(tenant, assetId)
    },
    [tenant]
  )

  return {
    uploadFileAsset,
    getAllAssetsForId,
    deleteAsset,
    getAsset,
    updateAsset,
    downloadAssetFile,
  }
}
