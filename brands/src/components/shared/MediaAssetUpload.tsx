import { useReducer, useRef, useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileUpload,
  ProgressBar,
  useToast,
  type FileUploadHandlerEvent,
  type FileUploadItemTemplateOptions,
  type FileUploadRef,
  type FileUploadSelectEvent,
} from '@emporix/component-library'
import type { AxiosProgressEvent } from 'axios'
import { BsFileEarmark, BsImage, BsXCircle } from 'react-icons/bs'

import { useMediaAssets } from '../../hooks/api/mediaAssets'
import { useUIBlocker } from '../../context/UIBlcoker'
import { getApiErrorDetails } from '../../helpers/api'
import type { Asset, MediaRefIdType } from '../../models/Assets.model'
import styles from './MediaAssetUpload.module.scss'

type MediaAssetUploadProps = {
  readonly type: MediaRefIdType
  readonly id: string
  readonly refresh?: () => void
  readonly managerPermissions?: boolean
  readonly multiple?: boolean
  readonly currentAsset?: Asset
  readonly acceptAllMedia?: boolean
  readonly className?: string
}

/** PrimeReact augments selected files with a preview object URL. */
type PreviewFile = File & { objectURL?: string }

type UploadingData = {
  uploadedSize?: number
  uploadedPercentage?: number
}

type FilesProgress = Record<string, UploadingData>

enum ActionsTypes {
  ADD_FILE = 'add-file',
  UPDATE_FILES = 'update-file-progress',
  CLEAR_ALL = 'delete-files',
}

type Actions = {
  type: ActionsTypes
  payload?: {
    fileName: string
    uploadedSize?: number
    uploadedPercentage?: number
  }
}

const reducer = (
  filesProgress: FilesProgress,
  action: Actions
): FilesProgress => {
  switch (action.type) {
    case ActionsTypes.ADD_FILE:
      if (!action.payload) return filesProgress
      return {
        ...filesProgress,
        [action.payload.fileName]: {
          uploadedSize: 0,
          uploadedPercentage: 0,
        },
      }
    case ActionsTypes.UPDATE_FILES:
      if (!action.payload) return filesProgress
      return {
        ...filesProgress,
        [action.payload.fileName]: {
          uploadedSize: action.payload.uploadedSize,
          uploadedPercentage: action.payload.uploadedPercentage,
        },
      }
    case ActionsTypes.CLEAR_ALL:
      return {}
    default:
      return filesProgress
  }
}

const MediaAssetUpload = ({
  type,
  id,
  refresh,
  managerPermissions = true,
  multiple = true,
  currentAsset,
  acceptAllMedia = false,
  className = '',
}: MediaAssetUploadProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { uploadFileAsset, deleteAsset } = useMediaAssets()
  const fileUploadRef = useRef<FileUploadRef>(null)
  const [totalSize, setTotalSize] = useState(0)
  const [filesUploadingState, dispatch] = useReducer(reducer, {})

  const formatSize = (bytes: number) =>
    fileUploadRef.current?.formatSize(bytes) ?? '0 B'

  const onTemplateSelect = (event: FileUploadSelectEvent) => {
    const addedSize = event.files.reduce((sum, file) => sum + file.size, 0)
    setTotalSize((prev) => prev + addedSize)
  }

  const onTemplateClear = () => {
    setTotalSize(0)
  }

  const onTemplateRemove = (
    file: File,
    onRemove: (event: SyntheticEvent) => void,
    event: SyntheticEvent
  ) => {
    setTotalSize((prev) => prev - file.size)
    onRemove(event)
  }

  const onUploadProgress = (
    uploadProgress: AxiosProgressEvent,
    fileName: string
  ) => {
    dispatch({
      type: ActionsTypes.UPDATE_FILES,
      payload: {
        fileName,
        uploadedSize: uploadProgress.loaded,
        uploadedPercentage: Math.round(
          (uploadProgress.loaded * 100) / (uploadProgress.total || 1)
        ),
      },
    })
  }

  const uploadAssets = async (event: FileUploadHandlerEvent) => {
    // Single-asset fields replace rather than append, so drop the old one first.
    if (!multiple && currentAsset) {
      try {
        await deleteAsset(currentAsset.id)
      } catch (e: unknown) {
        showError(t('brands.media.toast.deleteFailure'), getApiErrorDetails(e))
      }
    }

    for (const file of event.files) {
      dispatch({
        type: ActionsTypes.ADD_FILE,
        payload: { fileName: file.name },
      })
    }

    try {
      blockPanel(true)
      await Promise.all(
        event.files.map((file) =>
          uploadFileAsset(file, (e) => onUploadProgress(e, file.name), [
            { id, type },
          ])
        )
      )
      showSuccess(
        t('brands.media.toast.uploadSuccess', { count: event.files.length })
      )
    } catch (e: unknown) {
      showError(t('global.toasts.errorUploadAssets'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
      dispatch({ type: ActionsTypes.CLEAR_ALL })
      setTotalSize(0)
      event.options.clear()
      refresh?.()
    }
  }

  const headerTemplate = (options: unknown) => {
    const {
      className: headerClassName,
      chooseButton,
      uploadButton,
      cancelButton,
    } = options as {
      className: string
      chooseButton: React.ReactNode
      uploadButton: React.ReactNode
      cancelButton: React.ReactNode
    }

    return (
      <div className={[headerClassName, styles.header].join(' ')}>
        {chooseButton}
        {uploadButton}
        {cancelButton}
        <ProgressBar
          className={styles.headerProgress}
          value={totalSize === 0 ? 0 : 100}
          displayValueTemplate={() => formatSize(totalSize)}
        />
      </div>
    )
  }

  const itemTemplate = (
    file: object,
    options: FileUploadItemTemplateOptions
  ) => {
    const previewFile = file as PreviewFile
    const progress = filesUploadingState[previewFile.name]

    return (
      <div className={styles.item}>
        <div className={styles.itemInfo}>
          {!acceptAllMedia && previewFile.objectURL && (
            <img
              className={styles.itemThumb}
              alt={previewFile.name}
              role="presentation"
              src={previewFile.objectURL}
            />
          )}
          <span className={styles.itemName}>
            {previewFile.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <ProgressBar
          className={styles.itemProgress}
          value={progress?.uploadedPercentage ?? 0}
          displayValueTemplate={() =>
            `${progress ? formatSize(progress.uploadedSize ?? 0) : 0} / ${
              options.formatSize
            }`
          }
        />
        <button
          type="button"
          className={styles.itemRemove}
          aria-label={t('global.delete')}
          onClick={(event) =>
            onTemplateRemove(previewFile, options.onRemove, event)
          }
        >
          <BsXCircle size={22} aria-hidden />
        </button>
      </div>
    )
  }

  const emptyTemplate = () => (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        {acceptAllMedia ? <BsFileEarmark /> : <BsImage />}
      </span>
      <span className={styles.emptyText}>
        {t(
          acceptAllMedia
            ? 'brands.media.dropFileHere'
            : 'brands.media.dropImageHere'
        )}
      </span>
    </div>
  )

  return (
    <div className={className}>
      <FileUpload
        ref={fileUploadRef}
        disabled={!managerPermissions}
        customUpload
        uploadHandler={uploadAssets}
        multiple={multiple}
        accept={acceptAllMedia ? '*' : 'image/*'}
        onSelect={onTemplateSelect}
        onError={onTemplateClear}
        onClear={onTemplateClear}
        headerTemplate={headerTemplate}
        itemTemplate={itemTemplate}
        emptyTemplate={emptyTemplate}
        chooseLabel={t('brands.media.choose')}
        uploadLabel={t('brands.media.upload')}
        cancelLabel={t('brands.media.clear')}
        data-testid="media-asset-upload"
      />
    </div>
  )
}

export default MediaAssetUpload
