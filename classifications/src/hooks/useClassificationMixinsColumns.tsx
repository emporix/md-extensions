import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DataTableColumnProps } from '@emporix/component-library'
import { useLocalizedValue } from './useLocalizedValue'
import {
  TableAttribute,
  TableAttributeData,
} from '../helpers/classificationSchema.helpers'
import AttributeIndicator, {
  type AttributeChangeType,
} from '../components/classifications/AttributeIndicator'

const TABLE_COLUMNS_PATH = 'classifications.tables.mixinAttributes'

const getChangeType = (
  data: TableAttribute
): AttributeChangeType | undefined => {
  if (data.toChange) return 'changed'
  if (data.toAdd) return 'added'
  if (data.toDelete) return 'deleted'
  return undefined
}

/** Ported from management-dashboard `modules/classifications/hooks/useClassificationMixinsColumns`. */
const useClassificationMixinsColumns = () => {
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  const columns: DataTableColumnProps[] = useMemo(() => {
    const yesTemplate = (data: TableAttributeData) => (
      <div>
        {data.toChange && <AttributeIndicator changeType="changed" />}
        <div>{data.value ? t('global.yes') : null}</div>
      </div>
    )

    const labelTemplate = (data: TableAttribute) => (
      <div>
        <AttributeIndicator changeType={getChangeType(data)} />
        <div>{getContentLangValue(data.name)}</div>
      </div>
    )

    const flagColumn = (
      key: 'readOnly' | 'nullable' | 'required' | 'localized'
    ): DataTableColumnProps => ({
      columnKey: key,
      header: t(`${TABLE_COLUMNS_PATH}.${key}`),
      style: { width: '12%' },
      sortable: false,
      body: (rowData: TableAttribute) => yesTemplate(rowData[key]),
    })

    return [
      {
        columnKey: 'name',
        header: t(`${TABLE_COLUMNS_PATH}.name`),
        style: { width: '32%' },
        sortable: false,
        body: (rowData: TableAttribute) => labelTemplate(rowData),
      },
      flagColumn('readOnly'),
      flagColumn('nullable'),
      flagColumn('required'),
      flagColumn('localized'),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, getContentLangValue])

  return { columns }
}

export default useClassificationMixinsColumns
