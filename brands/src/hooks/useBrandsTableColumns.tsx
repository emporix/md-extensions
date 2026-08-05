import { useMemo } from 'react'
import {
  FilterMatchMode,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import type { Brand } from '../models/Brand.model'
import BrandsTableImage from '../components/brands/BrandsTableImage'

const COLUMN_PATH = 'brands.table.columns'

const useBrandsTableColumns = () => {
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
        body: (rowData: Brand) => <BrandsTableImage brand={rowData} />,
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

export default useBrandsTableColumns
