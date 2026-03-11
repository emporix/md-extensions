import type { ReactNode } from 'react'
import styles from './DataTableWidget.module.scss'

export type TableColumn<T> = {
  key: string
  header: string
  render: (item: T) => ReactNode
}

type DataTableWidgetProps<T> = {
  title: string
  seeAllHref: string
  seeAllLabel: string
  caption: string
  loading: boolean
  error: string | null
  items: T[]
  columns: TableColumn<T>[]
  getRowKey: (item: T) => string
  emptyMessage: string
  loadingMessage: string
  noAccessMessage?: string
  showNoAccess?: boolean
}

export const DataTableWidget = <T,>({
  title,
  seeAllHref,
  seeAllLabel,
  caption,
  loading,
  error,
  items,
  columns,
  getRowKey,
  emptyMessage,
  loadingMessage,
  noAccessMessage,
  showNoAccess = false,
}: DataTableWidgetProps<T>) => {
  const showTable = !loading && !error && !showNoAccess

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <a href={seeAllHref} className={styles.seeAllLink}>
          {seeAllLabel}
        </a>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <span>{loadingMessage}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{error}</span>
        </div>
      )}

      {showNoAccess && !loading && !error && noAccessMessage && (
        <div className={styles.placeholder}>
          <span>{noAccessMessage}</span>
        </div>
      )}

      {showTable && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>{caption}</caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={styles.th} scope="col">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={styles.emptyCell}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={getRowKey(item)} className={styles.row}>
                    {columns.map((col) => (
                      <td key={col.key} className={styles.td}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
