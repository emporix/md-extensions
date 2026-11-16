import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  toUploadPercent,
  useToast,
  type MediaAsset,
} from '@emporix/component-library'
import { useMediaAssets } from './api/mediaAssets'
import { useRefresh } from '../context/RefreshValuesProvider'
import { useUIBlocker } from '../context/UIBlcoker'
import { getApiErrorDetails } from '../helpers/api'
import { HOST_MEDIA_ASSET_PATH, assignHostLocation } from '../helpers/hostUrls'
import { MediaRefIdType } from '../models/Assets.model'

/**
 * Data and actions of the category media tab, ported from what MD's
 * `modules/media/AssetsViewer` and `MediaAssetUpload` do around the API
 * (`getAssetsForId`, `postFileAsset`, `delAsset`, `downloadAsset`), shaped for
 * the component library `AssetsViewer` and `MediaAssetUpload`.
 */
export const useCategoryMedia = (categoryId: string) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { refresh, setRefreshValue } = useRefresh()
  const { getAllAssetsForId, uploadFileAsset, deleteAsset, downloadAssetFile } =
    useMediaAssets()
  const [assets, setAssets] = useState<MediaAsset[]>([])

  // Nothing of another category or tenant stays visible while this loads.
  useEffect(() => {
    setAssets([])
  }, [categoryId, getAllAssetsForId])

  useEffect(() => {
    let isCurrent = true
    ;(async () => {
      try {
        const loaded = await getAllAssetsForId(categoryId)
        if (isCurrent) {
          setAssets(loaded as unknown as MediaAsset[])
        }
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      isCurrent = false
    }
  }, [categoryId, refresh, getAllAssetsForId])

  /** Uploads one file as a category asset, reporting 0-100 progress. */
  const uploadAsset = useCallback(
    async (file: File, onProgress: (percent: number) => void) => {
      await uploadFileAsset(
        file,
        (e) => onProgress(toUploadPercent(e.loaded, e.total)),
        [{ id: categoryId, type: MediaRefIdType.CATEGORY }]
      )
    },
    [categoryId, uploadFileAsset]
  )

  /** After a batch with at least one upload: reload the assets. */
  const onUploaded = useCallback(() => setRefreshValue(), [setRefreshValue])

  const onUploadError = useCallback(
    (error: unknown) => {
      console.error(error)
      showError(t('global.toasts.errorUploadAssets'), getApiErrorDetails(error))
    },
    [showError, t]
  )

  const deleteAssets = useCallback(
    async (toDelete: MediaAsset[]) => {
      try {
        blockPanel(true)
        await Promise.all(toDelete.map(({ id }) => deleteAsset(id)))
        showSuccess(
          t('categories.media.toast.bulkDeleteSuccess', {
            itemsLength: toDelete.length,
          })
        )
      } catch (e) {
        console.error(e)
      } finally {
        blockPanel(false)
        setRefreshValue()
      }
    },
    [deleteAsset, blockPanel, showSuccess, setRefreshValue, t]
  )

  const downloadAssets = useCallback(
    async (toDownload: MediaAsset[]) => {
      for (const asset of toDownload) {
        try {
          const blob = await downloadAssetFile(asset.id)
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = asset.details?.filename ?? asset.id
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (e) {
          console.error(`Failed to download ${asset.details?.filename}:`, e)
          showError(
            t('categories.media.toast.downloadFailure', {
              filename: asset.details?.filename,
            })
          )
        }
      }
    },
    [downloadAssetFile, showError, t]
  )

  // The asset detail screen is a root-level host route, outside this remote.
  const openAsset = useCallback((asset: MediaAsset) => {
    assignHostLocation(HOST_MEDIA_ASSET_PATH(asset.id))
  }, [])

  return {
    assets,
    uploadAsset,
    onUploaded,
    onUploadError,
    deleteAssets,
    downloadAssets,
    openAsset,
  }
}
