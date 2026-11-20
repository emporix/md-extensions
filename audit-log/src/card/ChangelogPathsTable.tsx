import { useMemo } from 'react'
import {
  DataTable,
  type DataTableColumnProps,
} from '@emporix/component-library'
import type { ChangelogEntryPathChange } from '@emporix/api-calls/next'
import type { EntityChangelogLabels } from '../labels'
import { formatChangelogValue } from './changelogEntry'
import styles from './ChangelogPathsTable.module.scss'

type ChangelogPathsTableProps = {
  readonly paths: Record<string, ChangelogEntryPathChange>
  readonly labels: Pick<
    EntityChangelogLabels,
    'notSet' | 'fieldColumn' | 'previousValueColumn' | 'updatedValueColumn'
  >
}

type ChangelogPathRow = {
  readonly field: string
  readonly change: ChangelogEntryPathChange
}

const ChangelogPathsTable = ({ paths, labels }: ChangelogPathsTableProps) => {
  const { notSet, fieldColumn, previousValueColumn, updatedValueColumn } =
    labels
  const rows = useMemo<ChangelogPathRow[]>(
    () => Object.entries(paths).map(([field, change]) => ({ field, change })),
    [paths]
  )

  const columns = useMemo<DataTableColumnProps[]>(() => {
    const renderValue = (value: string | null) =>
      value === null ? <span className={styles.notSet}>{notSet}</span> : value

    return [
      {
        columnKey: 'field',
        field: 'field',
        header: fieldColumn,
      },
      {
        columnKey: 'previousValue',
        header: previousValueColumn,
        body: (row: ChangelogPathRow) => (
          <span className={styles.previousValue}>
            {renderValue(formatChangelogValue(row.change.before))}
          </span>
        ),
      },
      {
        columnKey: 'updatedValue',
        header: updatedValueColumn,
        body: (row: ChangelogPathRow) => (
          <span className={styles.updatedValue}>
            {renderValue(formatChangelogValue(row.change.after))}
          </span>
        ),
      },
    ]
  }, [notSet, fieldColumn, previousValueColumn, updatedValueColumn])

  if (rows.length === 0) {
    return null
  }

  return (
    <DataTable
      className={styles.table}
      value={rows}
      dataKey="field"
      columns={columns}
      paginator={false}
      showFilter={false}
      showEmptyIcon={false}
    />
  )
}

export default ChangelogPathsTable
