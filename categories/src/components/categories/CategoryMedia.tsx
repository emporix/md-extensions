import { useTranslation } from 'react-i18next'
import {
  AssetsViewer,
  MediaAssetUpload,
  SectionTitle,
} from '@emporix/component-library'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useCategoryMedia } from '../../hooks/useCategoryMedia'
import { EmployeeDomains } from '../../configs/accessControls'
import styles from './CategoryMedia.module.scss'

type CategoryMediaProps = {
  readonly categoryId: string
}

// i18next fills `{{…}}`; these hand the component library its own placeholders.
const NAME = { name: '{name}' }
const COUNT = { itemsLength: '{count}' }

/** Media tab of a category (MD `modules/categories/components/CategoryMedia`). */
const CategoryMedia = ({ categoryId }: CategoryMediaProps) => {
  const { t } = useTranslation()
  const { tenant } = useDashboardContext()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const media = useCategoryMedia(categoryId)

  return (
    <div data-testid="category-media">
      <SectionTitle
        className={styles.title}
        name={t('categories.edit.tab.media.title')}
      />
      <AssetsViewer
        // Its selection belongs to one category's assets.
        key={`${tenant}:${categoryId}`}
        className={styles.viewer}
        assets={media.assets}
        readOnly={!canManage}
        onDelete={media.deleteAssets}
        onDownload={media.downloadAssets}
        onOpen={media.openAsset}
        labels={{
          delete: t('global.delete'),
          download: t('global.download'),
          selectAsset: t('categories.media.selectAsset', NAME),
          openAsset: t('categories.media.openAsset', NAME),
          deleteConfirmTitle: t('categories.media.confirm.singleDelete'),
          bulkDeleteConfirmTitle: t(
            'categories.media.confirm.bulkDelete',
            COUNT
          ),
          deleteConfirmMessage: t('categories.media.confirm.deleteDescription'),
          deleteConfirmAccept: t('global.yes'),
          deleteConfirmReject: t('global.cancel'),
        }}
        data-testid="category-assets"
      />
      <MediaAssetUpload
        onUpload={media.uploadAsset}
        onUploaded={media.onUploaded}
        onError={media.onUploadError}
        onUploadingChange={blockPanel}
        disabled={!canManage}
        labels={{
          choose: t('categories.media.choose'),
          upload: t('categories.media.upload'),
          clear: t('categories.media.clear'),
          dropHere: t('categories.media.dropImageHere'),
          removeFile: t('categories.media.removeFile'),
        }}
        data-testid="category-media-upload"
      />
    </div>
  )
}

export default CategoryMedia
