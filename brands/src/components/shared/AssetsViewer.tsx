import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  ConfirmBox,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import {
  BsDownload,
  BsFileEarmark,
  BsFileEarmarkText,
  BsFileExcel,
  BsFilePdf,
} from 'react-icons/bs'

import type { Asset } from '../../models/Assets.model'
import { useMediaAssets } from '../../hooks/api/mediaAssets'
import { useUIBlocker } from '../../context/UIBlcoker'
import { getApiErrorDetails } from '../../helpers/api'
import { FileType, getFileType, isImageFile } from '../../helpers/media.helpers'
import styles from './AssetsViewer.module.scss'

type AssetsViewerProps = {
  readonly assets: Asset[]
  readonly refresh?: () => void
  readonly managerPermissions?: boolean
  readonly showAllMediaTypes?: boolean
  readonly className?: string
}

type FileTileConfig = {
  icon?: ReactNode
  label: string
  color: string
}

const getFileTileConfig = (filename: string): FileTileConfig => {
  switch (getFileType(filename)) {
    case FileType.PDF:
      return { icon: <BsFilePdf size={40} />, label: 'PDF', color: '#E53E3E' }
    case FileType.SHEET:
      return {
        icon: <BsFileExcel size={40} />,
        label: 'Sheet',
        color: '#217346',
      }
    case FileType.TXT:
      return {
        icon: <BsFileEarmarkText size={40} />,
        label: 'TXT',
        color: '#3e4ce5',
      }
    case FileType.PNG:
      return { label: 'PNG', color: '#3e81e5' }
    case FileType.JPEG:
      return { label: 'JPEG', color: '#3e81e5' }
    default:
      return {
        icon: <BsFileEarmark size={40} />,
        label: 'FILE',
        color: '#6b7280',
      }
  }
}

const AssetsViewer = ({
  assets,
  refresh,
  managerPermissions = true,
  showAllMediaTypes = false,
  className = '',
}: AssetsViewerProps) => {
  const { t } = useTranslation()
  const { deleteAsset, downloadAssetFile } = useMediaAssets()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError } = useToast()

  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)

  const onCheck = (fileId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(fileId)
        ? prev.filter((assetId) => assetId !== fileId)
        : [...prev, fileId]
    )
  }

  const deleteAssets = useCallback(async () => {
    try {
      setIsDeleteConfirmOpened(false)
      blockPanel(true)
      await Promise.all(selectedAssets.map((assetId) => deleteAsset(assetId)))
      showSuccess(
        t('brands.media.toast.bulkDeleteSuccess', {
          itemsLength: selectedAssets.length,
        })
      )
    } catch (e: unknown) {
      showError(t('brands.media.toast.deleteFailure'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
      setSelectedAssets([])
      refresh?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssets])

  const downloadAssets = useCallback(async () => {
    const selectedAssetsData = assets.filter((asset) =>
      selectedAssets.includes(asset.id)
    )

    for (const asset of selectedAssetsData) {
      try {
        const blob = await downloadAssetFile(asset.id)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = asset.details?.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (e: unknown) {
        showError(
          t('brands.media.toast.downloadFailure', {
            filename: asset.details?.filename,
          }),
          getApiErrorDetails(e)
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssets, assets, t, downloadAssetFile])

  const openAssetDetails = (assetId: string) => {
    // The asset detail screen lives in the management-dashboard host at a
    // root-level route, outside this remote's HashRouter, so there is no
    // in-remote route to push. A full-page navigation is the deliberate
    // escape hatch; revisit if AppState ever gains a host-navigation callback.
    window.location.assign(`/media-assets/${assetId}`)
  }

  const assetTemplate = (asset: Asset) => {
    const config = getFileTileConfig(asset.details?.filename)
    const isSelected = selectedAssets.includes(asset.id)

    return (
      <div
        key={asset.id}
        className={[styles.tile, isSelected ? styles.tileSelected : '']
          .filter(Boolean)
          .join(' ')}
      >
        <Checkbox
          className={styles.tileCheckbox}
          disabled={!managerPermissions}
          onChange={() => onCheck(asset.id)}
          checked={isSelected}
          data-testid={`asset-checkbox-${asset.id}`}
        />
        <div
          className={styles.tilePreview}
          role="button"
          tabIndex={0}
          onClick={() => openAssetDetails(asset.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openAssetDetails(asset.id)
            }
          }}
        >
          {isImageFile(asset.details?.filename) ? (
            <img
              className={styles.tileImage}
              src={asset.url}
              alt={asset.details?.filename}
            />
          ) : (
            <div className={styles.tileIcon} style={{ color: config.color }}>
              {config.icon}
            </div>
          )}
        </div>
        <div className={styles.tileLabel} style={{ background: config.color }}>
          {config.label}
        </div>
        <div className={styles.tileFilename}>
          <p>{asset.details?.filename}</p>
        </div>
      </div>
    )
  }

  const visibleAssets = assets.filter((asset) =>
    showAllMediaTypes ? true : isImageFile(asset.details?.filename)
  )

  return (
    <div className={className}>
      <div className={styles.actions}>
        <SecondaryButton
          disabled={selectedAssets.length < 1 || !managerPermissions}
          onClick={() => setIsDeleteConfirmOpened(true)}
        >
          {/* Same glyph as management-dashboard (`pi pi-trash`). The
              primeicons font ships inside @emporix/component-library/styles,
              so this needs no primeicons dependency in the remote. */}
          <i className="pi pi-trash" aria-hidden />
          {`${t('global.delete')} (${selectedAssets.length})`}
        </SecondaryButton>
        <SecondaryButton
          disabled={selectedAssets.length < 1}
          onClick={downloadAssets}
        >
          <BsDownload size={16} aria-hidden />
          {`${t('global.download')} (${selectedAssets.length})`}
        </SecondaryButton>
      </div>
      <div className={styles.grid}>{visibleAssets.map(assetTemplate)}</div>
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={deleteAssets}
        onReject={() => setIsDeleteConfirmOpened(false)}
        title={t(
          selectedAssets.length > 1
            ? 'brands.media.confirm.bulkDelete'
            : 'brands.media.confirm.singleDelete',
          { itemsLength: selectedAssets.length }
        )}
        message={t('brands.media.confirm.deleteDescription', {
          itemsLength: selectedAssets.length,
        })}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
      />
    </div>
  )
}

export default AssetsViewer
