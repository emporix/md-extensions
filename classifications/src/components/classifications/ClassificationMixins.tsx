import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { BsPlusLg } from 'react-icons/bs'
import { PrimaryButton, SectionBox } from '@emporix/component-library'
import ClassificationMixinsTile from './ClassificationMixinsTile'
import { ClassificationSchemasProvider } from '../../context/ClassificationSchemas.provider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import styles from './ClassificationMixins.module.scss'

/** Ported from management-dashboard `modules/classifications/components/ClassificationMixins`. */
const ClassificationMixins = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<ClassificationFormFields>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const [expandedIndexes, setExpandedIndexes] = useState(new Set<number>())
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ownClassificationMixins',
  })

  const handleAdd = () => {
    append({
      required: false,
      schemaUrl: '',
      name: 'newClassificationSchema',
    })
  }

  const toggleExpanded = (index: number) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <SectionBox name={t('classifications.titles.classification')}>
      <div className={styles.tiles}>
        <ClassificationSchemasProvider>
          {fields.map((field, idx) => (
            <ClassificationMixinsTile
              className={styles.tile}
              key={field.id}
              tileId={field.id}
              tileIdx={idx}
              canManage={canManage}
              onRemove={() => remove(idx)}
              isExpanded={expandedIndexes.has(idx)}
              onExpand={() => toggleExpanded(idx)}
            />
          ))}
        </ClassificationSchemasProvider>
      </div>
      <div className={styles.addRow}>
        <PrimaryButton
          disabled={!canManage}
          onClick={handleAdd}
          data-testid="classification-schema-add"
        >
          <BsPlusLg size={16} className={styles.addIcon} />
        </PrimaryButton>
        {fields.length === 0 && (
          <div>{t('classifications.labels.noSchema')}</div>
        )}
      </div>
    </SectionBox>
  )
}

export default ClassificationMixins
