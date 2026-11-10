import type { DataTablePageEvent } from '@emporix/component-library'
import { Dropdown } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const first = paginationParams.first ?? 0
  const rows = paginationParams.rows ?? 10
  const rowsPerPageOptions = paginationParams.rowsPerPageOptions ?? [
    10, 25, 50, 100,
  ]
  const pageCount = Math.max(1, Math.ceil(totalRecords / rows))
  const currentPage = Math.floor(first / rows)
  const startRecord = totalRecords === 0 ? 0 : first + 1
  const endRecord = Math.min(first + rows, totalRecords)

  const emitPage = (nextFirst: number, nextRows: number) => {
    const page = Math.floor(nextFirst / nextRows)
    onPageChange({
      first: nextFirst,
      rows: nextRows,
      page,
      pageCount: Math.max(1, Math.ceil(totalRecords / nextRows)),
    })
  }

  const goToPage = (pageIndex: number) => {
    const clamped = Math.max(0, Math.min(pageIndex, pageCount - 1))
    emitPage(clamped * rows, rows)
  }

  const visiblePages = (() => {
    const windowSize = 5
    let start = Math.max(0, currentPage - Math.floor(windowSize / 2))
    const end = Math.min(pageCount, start + windowSize)
    start = Math.max(0, end - windowSize)
    return Array.from({ length: end - start }, (_, i) => start + i)
  })()

  return (
    <nav className={styles.paginator} aria-label={t('global.pagination')}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 0}
          onClick={() => goToPage(0)}
          aria-label={t('global.firstPage', { defaultValue: 'First page' })}
        >
          «
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 0}
          onClick={() => goToPage(currentPage - 1)}
          aria-label={t('global.previousPage', {
            defaultValue: 'Previous page',
          })}
        >
          ‹
        </button>
        {visiblePages.map((pageIndex) => (
          <button
            key={pageIndex}
            type="button"
            className={`${styles.pageButton} ${
              pageIndex === currentPage ? styles.pageButtonActive : ''
            }`}
            onClick={() => goToPage(pageIndex)}
            aria-current={pageIndex === currentPage ? 'page' : undefined}
          >
            {pageIndex + 1}
          </button>
        ))}
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= pageCount - 1}
          onClick={() => goToPage(currentPage + 1)}
          aria-label={t('global.nextPage', { defaultValue: 'Next page' })}
        >
          ›
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= pageCount - 1}
          onClick={() => goToPage(pageCount - 1)}
          aria-label={t('global.lastPage', { defaultValue: 'Last page' })}
        >
          »
        </button>
        <span className={styles.currentReport}>
          {t('global.pagination', {
            first: startRecord,
            last: endRecord,
            totalRecords,
            defaultValue: `${startRecord} - ${endRecord} of ${totalRecords}`,
          })}
        </span>
      </div>
      <Dropdown
        className={styles.rowsDropdown}
        options={rowsPerPageOptions.map((value) => ({
          label: String(value),
          value,
        }))}
        optionLabel="label"
        optionValue="value"
        value={rows}
        onChange={(e) => {
          const nextRows = Number(e.value ?? rows)
          emitPage(0, nextRows)
        }}
      />
    </nav>
  )
}

export default ChangelogPaginator
