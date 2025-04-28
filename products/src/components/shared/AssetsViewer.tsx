import { useCallback, useState } from 'react'
import './ImageInputField.scss'
import { useTranslation } from 'react-i18next'
import { Asset } from '../../models/Assets'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import ConfirmBox from './ConfirmBox'
import { useMediaAssets } from '../../api/mediaAssets'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useToast } from '../../context/ToastProvider'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'

const AssetsViewer = (props: {
  assets: Asset[]
  refresh?: () => void
  categoryId: string
  managerPermissions?: boolean
}) => {
  const { t } = useTranslation()
  const { assets, refresh, categoryId, managerPermissions } = props
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const { deleteAsset } = useMediaAssets()
  const { blockPanel } = useUIBlocker()
  const toast = useToast()
  const { navigate } = useCustomNavigate()

  const onCheck = (fileId: string) => {
    selectedAssets.includes(fileId)
      ? setSelectedAssets((prev) =>
          prev.filter((assetId) => assetId !== fileId)
        )
      : setSelectedAssets((prev) => [...prev, fileId])
  }

  const deleteAssets = useCallback(async () => {
    try {
      setIsDeleteConfirmOpened(false)
      blockPanel(true)
      await Promise.all(
        selectedAssets.map(async (assetId) => await deleteAsset(assetId))
      )
      toast.showToast(
        t('products.media.toast.bulkDeleteSuccess', {
          itemsLength: selectedAssets.length,
        }),
        '',
        'success'
      )
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
      setSelectedAssets([])
      if (refresh) {
        refresh()
      }
    }
  }, [selectedAssets])

  return (
    <>
      <h2>Images</h2>
      <Button
        className="p-button p-button-secondary mb-2 mt-4"
        label={t('global.delete') + `  (${selectedAssets.length})`}
        disabled={selectedAssets.length < 1 || !managerPermissions}
        onClick={() => setIsDeleteConfirmOpened(true)}
      />
      <div className="flex gap-2 flex-wrap">
        {assets.map((asset: Asset) => {
          return (
            <div
              className={`relative border-2 border-round-xs ${
                selectedAssets.includes(asset.id)
                  ? ' border-blue-400'
                  : 'border-transparent'
              }`}
              style={{ height: '228px' }}
              key={asset.id}
            >
              <img
                onClick={() =>
                  navigate(`/categories/${categoryId}/${asset.id}`)
                }
                src={asset.url}
                alt={asset.details.filename}
                className="h-14rem max-w-10rem"
                style={{ objectFit: 'cover' }}
              />

              <div className="h-2rem w-full top-0 left-0 absolute  flex justify-content-between bg-white-alpha-50 pl-1 pr-1">
                <div className="mt-1">
                  <Checkbox
                    disabled={!managerPermissions}
                    onChange={() => onCheck(asset.id)}
                    checked={selectedAssets.includes(asset.id)}
                  />
                </div>
                <div>...</div>
              </div>
              <div className="h-3rem pt-2 w-full max-w-140 bottom-0 left-0 absolute bg-white-alpha-50 text-center ">
                <p className="pt-1 pl-1 pr-1 overflow-hidden text-overflow-ellipsis white-space-nowrap">
                  {asset.details.filename}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={deleteAssets}
        onReject={() => setIsDeleteConfirmOpened(false)}
        title={t(
          selectedAssets.length > 1
            ? 'categories.media.confirm.bulkDelete'
            : 'categories.media.confirm.singleDelete',
          {
            itemsLength: selectedAssets.length,
          }
        )}
      />
    </>
  )
}

AssetsViewer.defaultProps = {
  managerPermissions: true,
}

export default AssetsViewer
