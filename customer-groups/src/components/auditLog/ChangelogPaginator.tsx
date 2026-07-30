import {
  DataTable,
  type DataTablePageEvent,
  type DataTablePaginationState,
} from '@emporix/component-library'
import type { PaginationProps } from '../../hooks/usePagination'
import styles from './ChangelogPaginator.module.scss'

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
  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords,
  }

  return (
    <DataTable
      className={styles.root}
      dataKey="id"
      value={[]}
      columns={[]}
      pagination={pagination}
      paginator
      lazy
      totalRecords={totalRecords}
      onPage={onPageChange}
      showHeaders={false}
      showFilter={false}
      showEmptyIcon={false}
      emptyTemplate={() => null}
    />
  )
}

export default ChangelogPaginator
