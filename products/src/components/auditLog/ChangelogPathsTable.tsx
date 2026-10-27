import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  type DataTableColumnProps,
} from '@emporix/component-library'
import type { ChangelogPathChange } from '../../models/Changelog.model'
import { formatChangelogValue } from '../../helpers/auditLog/entityChangelog.helpers'
import styles from './ChangelogPathsTable.module.scss'

type ChangelogPathsTableProps = {
  readonly paths: Record<string, ChangelogPathChange>
}

type ChangelogPathRow = {
  readonly field: string
  readonly change: ChangelogPathChange
}

const ChangelogPathsTable = ({ paths }: ChangelogPathsTableProps) => {
  const { t } = useTranslation()

  const rows = useMemo<ChangelogPathRow[]>(
    () => Object.entries(paths).map(([field, change]) => ({ field, change })),
    [paths]
  )

  const columns = useMemo<DataTableColumnProps[]>(() => {
    const renderValue = (value: string | null) =>
      value === null ? (
        <span className={styles.notSet}>
          {t('auditLog.entityChangelog.notSet')}
        </span>
      ) : (
        value
      )

    return [
      {
        columnKey: 'field',
        field: 'field',
        header: t('auditLog.entityChangelog.table.field'),
      },
      {
        columnKey: 'previousValue',
        header: t('auditLog.entityChangelog.table.previousValue'),
        body: (row: ChangelogPathRow) => (
          <span className={styles.previousValue}>
            {renderValue(formatChangelogValue(row.change.before))}
          </span>
        ),
      },
      {
        columnKey: 'updatedValue',
        header: t('auditLog.entityChangelog.table.updatedValue'),
        body: (row: ChangelogPathRow) => (
          <span className={styles.updatedValue}>
            {renderValue(formatChangelogValue(row.change.after))}
          </span>
        ),
      },
    ]
  }, [t])

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
