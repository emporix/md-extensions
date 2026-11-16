import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { BsChevronRight, BsTrashFill } from 'react-icons/bs'
import { IconButton } from '@emporix/component-library'
import ClassificationMixinsTileForm from './ClassificationMixinsTileForm'
import VersionBadge from './VersionBadge'
import { useClassificationVersionData } from '../../context/ClassificationVersion.provider'
import { textToTitleCase } from '../../helpers/utils'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import styles from './ClassificationMixins.module.scss'

type ClassificationMixinsTileProps = {
  readonly tileIdx: number
  readonly tileId: string
  readonly canManage: boolean
  readonly onRemove: () => void
  readonly isExpanded: boolean
  readonly onExpand: () => void
  readonly className?: string
}

/** Ported from management-dashboard `modules/classifications/components/ClassificationMixinsTile`. */
const ClassificationMixinsTile = ({
  className = '',
  tileIdx,
  tileId,
  canManage,
  onRemove,
  isExpanded,
  onExpand,
}: ClassificationMixinsTileProps) => {
  const { t } = useTranslation()
  const { watch } = useFormContext<ClassificationFormFields>()
  const { getSchemaVersionForId } = useClassificationVersionData()
  const name =
    textToTitleCase(watch(`ownClassificationMixins.${tileIdx}.name`)) || '--'
  const schemaVersion = getSchemaVersionForId(tileId)
  const testId = `classification-schema-${tileIdx}`

  return (
    <div className={className} data-testid={testId}>
      <div className={styles.tileHeader}>
        <button
          type="button"
          className={styles.tileToggle}
          aria-expanded={isExpanded}
          onClick={onExpand}
          data-testid={`${testId}-toggle`}
        >
          <BsChevronRight
            size={16}
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          />
          <span className={styles.tileName}>{name}</span>
          {schemaVersion && (
            <VersionBadge
              version={schemaVersion}
              data-testid={`${testId}-version`}
            />
          )}
        </button>
        <IconButton
          className={styles.tileDelete}
          icon={<BsTrashFill size={14} />}
          ariaLabel={t('global.delete')}
          disabled={!canManage}
          onClick={onRemove}
          data-testid={`${testId}-delete`}
        />
      </div>
      <ClassificationMixinsTileForm
        className={isExpanded ? styles.formExpanded : styles.formCollapsed}
        tileId={tileId}
        tileIdx={tileIdx}
        canManage={canManage}
      />
    </div>
  )
}

export default ClassificationMixinsTile
