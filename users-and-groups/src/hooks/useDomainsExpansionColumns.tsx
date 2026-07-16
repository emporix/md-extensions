import { useMemo } from 'react'
import type { DataTableColumnProps } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { AccessControl } from '../models/Permissions.model'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { BsCheck } from 'react-icons/bs'
import styles from './useDomainsExpansionColumns.module.scss'

export const TABLE_COLUMNS_PATH =
  'usersAndGroups.groups.tables.accessControlsExpansion'

const useAccessControlsColumns = () => {
  const { i18n, t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()

  const columns: DataTableColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'gapStart',
        style: { width: '80px', minWidth: '80px' },
        body: () => <span />,
      },
      {
        columnKey: 'details',
        style: { width: '100%', minWidth: '600px' },
        filter: false,
        sortable: false,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: AccessControl) => (
          <div className={styles.detailsCell}>
            <div className="font-bold">{getUiLangValue(rowData.name)}</div>
            <div title={rowData.id} className={styles.identifier}>
              {rowData.id}
            </div>
            {rowData.description?.[i18n.language] && (
              <div>{getUiLangValue(rowData.description)}</div>
            )}
            <div className={styles.scopeList}>
              {rowData.scopes?.map((s) => (
                <div key={s} className={styles.scopeBadge}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        columnKey: 'siteAware',
        style: { width: '150px', minWidth: '150px' },
        filter: false,
        sortable: false,
        showFilterMenu: false,
        showClearButton: false,
        body: (rowData: AccessControl) =>
          rowData.restrictionAware ? (
            <div className={styles.statusCell}>
              <BsCheck style={{ color: 'var(--green)' }} size={20} />
              <span className={styles.statusLabel}>
                {t('usersAndGroups.groups.labels.restrictionAware')}
              </span>
            </div>
          ) : null,
      },
    ]
  }, [i18n.language])

  return { columns }
}

export default useAccessControlsColumns
