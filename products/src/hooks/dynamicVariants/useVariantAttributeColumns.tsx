import { useCallback, useMemo } from 'react'
import { type DataTableColumnProps } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../useLocalizedValue'
import { DynamicVariantAttribute } from '../../models/Category.model'
import Localized from '../../models/Localized.model'
import TableActions from '../../components/shared/TableActions'
import styles from '../../components/products/dynamicVariants/DynamicVariant.module.scss'

interface AttributeRow {
  key: string
  attr: DynamicVariantAttribute
}

interface Props {
  type: 'local' | 'inherited'
  onEdit?: (row: AttributeRow) => void
  onDelete?: (row: AttributeRow) => void
}

export const TABLE_COLUMNS_PATH = 'products.dynamicVariant.tables.attributes'

const useVariantAttributeColumns = (props: Props) => {
  const { type, onEdit, onDelete } = props
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  /** Rendered through the CL DataTable `rowActions` column. */
  const rowActions = useCallback(
    (row: AttributeRow) => (
      <TableActions
        onEdit={onEdit ? () => onEdit(row) : undefined}
        onDelete={onDelete ? () => onDelete(row) : undefined}
        deleteConfirm={{
          pluralsPath: 'products.dynamicVariant.plurals',
          entity: row.attr,
        }}
      />
    ),
    [onEdit, onDelete]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'attribute',
        header:
          type === 'local'
            ? t(`${TABLE_COLUMNS_PATH}.localAttribute`)
            : t(`${TABLE_COLUMNS_PATH}.inheritedAttribute`),
        style: { width: '35%' },
        body: (row: AttributeRow) => {
          return row.attr.name
            ? getContentLangValue(row.attr.name as Localized)
            : row.key
        },
      },
      {
        columnKey: 'value',
        header: t(`${TABLE_COLUMNS_PATH}.value`),
        style: { width: '35%' },
        body: (row: AttributeRow) => {
          const vn = row.attr.value?.name
            ? getContentLangValue(row.attr.value.name as Localized)
            : row.attr.value.qualifier
          const u = row.attr.value?.unit
          return [vn, u].filter(Boolean).join(' ')
        },
      },
      {
        columnKey: 'badge',
        style: { width: '10%' },
        body: () => (
          <div
            className={[
              styles.attributeBadge,
              type === 'local'
                ? styles.attributeBadgeLocal
                : styles.attributeBadgeInherited,
            ].join(' ')}
          >
            {type === 'local'
              ? t('products.dynamicVariant.labels.local')
              : t('products.dynamicVariant.labels.inherited')}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, type, getContentLangValue]
  )

  return { columns, rowActions }
}

export type { AttributeRow }
export default useVariantAttributeColumns
