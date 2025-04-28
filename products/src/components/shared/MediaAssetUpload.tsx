import { useReducer, useRef, useState } from 'react'
import './ImageInputField.scss'
import { Button } from 'primereact/button'
import { FileUpload, ProgressBar } from 'primereact'
import { Tooltip } from 'primereact/tooltip'
import { useTranslation } from 'react-i18next'
import { useMediaAssets } from '../../api/mediaAssets'
import { Asset, MediaRefIdType, RefId } from '../../models/Assets'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useToast } from '../../context/ToastProvider'
import { AxiosProgressEvent } from 'axios'

const MediaAssetUpload = (props: {
  type: MediaRefIdType
  id: string
  refresh?: () => void
  managerPermissions?: boolean
  multiple?: boolean
  currentAsset?: Asset
}) => {
  const { t } = useTranslation()
  const { type, id, refresh, managerPermissions, multiple, currentAsset } =
    props
  const [totalSize, setTotalSize] = useState(0)
  const toast = useToast()
  const { blockPanel } = useUIBlocker()
  const fileUploadRef = useRef<FileUpload>(null)

  const { uploadFileAsset, deleteAsset } = useMediaAssets()
  const [currentRefId] = useState<RefId>({
    type,
    id,
  })

  enum ActionsTypes {
    ADD_FILE = 'add-file',
    UPDATE_FILES = 'update-file-progress',
    CLEAR_ALL = 'delete-files',
  }

  interface Actions {
    type: ActionsTypes
    payload?: {
      fileName: string
      uploadedSize?: number
      uploadedPercentage?: number
    }
  }

  interface UploadingData {
    uploadedSize?: number
    uploadedPercentage?: number
  }

  interface ReducerReturn {
    [key: string]: UploadingData
  }

  const reducer = (
    filesProgress: ReducerReturn,
    action: Actions
  ): ReducerReturn => {
    switch (action.type) {
      case ActionsTypes.ADD_FILE:
        if (action.payload) {
          return {
            ...filesProgress,
            [action.payload.fileName]: {
              uploadedSize: 0,
              uploadedPercentage: 0,
            },
          }
        }
        return filesProgress
      case ActionsTypes.CLEAR_ALL:
        filesProgress = {}
        return filesProgress

      case ActionsTypes.UPDATE_FILES:
        if (action.payload) {
          return {
            ...filesProgress,
            [action.payload.fileName]: {
              uploadedSize: action.payload.uploadedSize,
              uploadedPercentage: action.payload.uploadedPercentage,
            },
          }
        }
        return filesProgress
      default:
        return filesProgress
    }
  }

  const [filesUploadingState, dispatch] = useReducer(reducer, {})

  const onTemplateSelect = (e: { files: File[] }) => {
    let newTotalSize = totalSize
    if (e.files.length > 1) {
      ;[...e.files].forEach((file: File) => {
        newTotalSize += file.size
      })
    } else newTotalSize += e.files[0].size

    setTotalSize(newTotalSize)
  }

  const onTemplateUpload = (e: { files: File[] }) => {
    let newTotalSize = totalSize
    for (const file of e.files) {
      newTotalSize += file.size || 0
      dispatch({
        type: ActionsTypes.ADD_FILE,
        payload: { fileName: file.name },
      })
    }

    setTotalSize(newTotalSize)
    toast.showToast(t('File Uploaded'), '', 'success')
  }

  const onTemplateRemove = (file: File, callback: () => void) => {
    setTotalSize(totalSize - file.size)
    callback()
  }

  const onTemplateClear = () => {
    setTotalSize(0)
  }

  const headerTemplate = (options: any) => {
    const { className, chooseButton, uploadButton, cancelButton } = options
    const formattedValue =
      fileUploadRef && fileUploadRef.current
        ? fileUploadRef.current.formatSize(totalSize)
        : '0 B'

    return (
      <div
        className={className}
        style={{
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chooseButton}
        {uploadButton}
        {cancelButton}
        <ProgressBar
          value={totalSize === 0 ? 0 : 100}
          displayValueTemplate={() => `${formattedValue}`}
          style={{ width: '300px', height: '20px', marginLeft: 'auto' }}
        ></ProgressBar>
      </div>
    )
  }

  const itemTemplate = (file: any, props: any) => {
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: '40%' }}>
          <img
            alt={file.name}
            role="presentation"
            src={file.objectURL}
            width={100}
          />
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <ProgressBar
          value={
            filesUploadingState[file.name]
              ? filesUploadingState[file.name].uploadedPercentage
              : 0
          }
          displayValueTemplate={() =>
            `${
              filesUploadingState[file.name] && fileUploadRef.current
                ? fileUploadRef.current.formatSize(
                    filesUploadingState[file.name].uploadedSize as number
                  )
                : 0
            } / ${props.formatSize}`
          }
          style={{ width: '300px', height: '20px', marginLeft: 'auto' }}
        ></ProgressBar>
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={() => onTemplateRemove(file, props.onRemove)}
        />
      </div>
    )
  }

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column">
        <i
          className="pi pi-image mt-3 p-5"
          style={{
            fontSize: '5em',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-grey-100)',
            color: 'var(--brand-grey-500)',
          }}
        ></i>
        <span
          style={{ fontSize: '1.2em', color: 'var(--brand-grey-500)' }}
          className="my-5"
        >
          Drag and Drop Image Here
        </span>
      </div>
    )
  }

  const chooseOptions = {
    icon: 'pi pi-fw pi-images',
    iconOnly: true,
    className: 'custom-choose-btn p-button-rounded p-button-outlined',
  }
  const uploadOptions = {
    icon: 'pi pi-fw pi-cloud-upload',
    iconOnly: true,
    className:
      'custom-upload-btn p-button-success p-button-rounded p-button-outlined',
  }
  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    iconOnly: true,
    className:
      'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined',
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

  const uploadAssets = async (e: { files: File[] }) => {
    if (!multiple && currentAsset !== undefined) {
      try {
        await deleteAsset(currentAsset.id)
      } catch (e) {
        console.error(e)
      }
    }

    try {
      blockPanel(true)
      await Promise.all(
        e.files.map(async (file: File) => {
          return await uploadFileAsset(
            file,
            (e) => onUploadProgress(e, file.name),
            [currentRefId]
          )
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
      dispatch({ type: ActionsTypes.CLEAR_ALL })
      // cant be faster than api
      // @ts-ignore
      setTimeout(() => fileUploadRef.current.clear(), 500)
      if (refresh) {
        refresh()
      }
    }
  }

  return (
    <>
      <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
      <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
      <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

      <div className="card">
        <div className="grid grid-nogutter">
          <div className="col-6 module-subtitle mb-3 mt-5">
            {t('products.media.fileUploaderTitle')}
          </div>
        </div>

        <FileUpload
          disabled={!managerPermissions}
          ref={fileUploadRef}
          customUpload
          uploadHandler={uploadAssets}
          multiple={multiple}
          accept="image/*"
          onUpload={onTemplateUpload}
          onSelect={onTemplateSelect}
          onError={onTemplateClear}
          onClear={onTemplateClear}
          headerTemplate={headerTemplate}
          itemTemplate={itemTemplate}
          emptyTemplate={emptyTemplate}
          chooseOptions={chooseOptions}
          uploadOptions={uploadOptions}
          cancelOptions={cancelOptions}
        />
      </div>
    </>
  )
}

MediaAssetUpload.defaultProps = {
  managerPermissions: true,
  multiple: true,
}

export default MediaAssetUpload
