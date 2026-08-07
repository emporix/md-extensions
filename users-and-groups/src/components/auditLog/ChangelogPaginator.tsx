import type { DataTablePageEvent } from '@emporix/component-library'
import { Paginator } from 'primereact/paginator'
import { useTranslation } from 'react-i18next'
import type { PaginationProps } from '../../hooks/usePagination'
import styles from './ChangelogPaginator.module.scss'

const PAGINATOR_TEMPLATE =
  'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'

type ChangelogPaginatorProps = {
  readonly paginationParams: Partial<PaginationProps>
  readonly totalRecords: number
  readonly onPageChange: (event: DataTablePageEvent) => void
}

const ChangelogPaginator = ({
  paginationParams,
  totalRecords,
  onPageChange,
}: ChangelogPaginatorProps) => {
  const { t } = useTranslation()

  const handlePageChange = (event: DataTablePageEvent) => {
    onPageChange(event)
  }

  return (
    <Paginator
      className={styles.paginator}
      first={paginationParams.first ?? 0}
      rows={paginationParams.rows ?? 10}
      totalRecords={totalRecords}
      rowsPerPageOptions={paginationParams.rowsPerPageOptions}
      onPageChange={handlePageChange}
      template={PAGINATOR_TEMPLATE}
      currentPageReportTemplate={t('global.pagination')}
    />
  )
}

export default ChangelogPaginator
