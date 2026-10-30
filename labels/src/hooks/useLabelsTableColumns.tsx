import { useMemo } from 'react'
import {
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import type { Label } from '../models/Label.model'
import LabelsTableImage from '../components/labels/LabelsTableImage'

const COLUMN_PATH = 'labels.table.columns'

const useLabelsTableColumns = () => {
  const { i18n, t } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(() => {
    const language = i18n.language

    return [
      {
        columnKey: 'image',
        header: t(`${COLUMN_PATH}.image`, { lng: language }),
        field: 'image',
        showFilterMenu: false,
        showClearButton: false,
        style: { width: '8rem' },
        body: (rowData: Label) => <LabelsTableImage label={rowData} />,
      },
      {
        columnKey: 'name',
        header: t(`${COLUMN_PATH}.name`, { lng: language }),
        field: 'name',
        filterField: 'name',
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
    ]
  }, [i18n.language, t])

  return { columns }
}

export default useLabelsTableColumns
