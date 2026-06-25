import { useMemo } from 'react'
import { ColumnProps } from 'primereact/column'
import { useTranslation } from 'react-i18next'
import { AccessControl } from '../models/Permissions.model'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { BsCheck } from 'react-icons/bs'

export const TABLE_COLUMNS_PATH =
  'usersAndGroups.groups.tables.accessControlsExpansion'

const useAccessControlsColumns = () => {
  const { i18n, t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()

  const columns: ColumnProps[] = useMemo(() => {
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
          <div className="flex flex-column gap-2 py-2">
            <div className="font-bold">{getUiLangValue(rowData.name)}</div>
            <div
              title={rowData.id}
              style={{
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--grey-6)',
                fontSize: '0.85rem',
              }}
            >
              {rowData.id}
            </div>
            {rowData.description?.[i18n.language] && (
              <div>{getUiLangValue(rowData.description)}</div>
            )}
            <div className="flex flex-wrap gap-2">
              {rowData.scopes?.map((s) => (
                <div
                  key={s}
                  style={{
                    border: '1px solid var(--blue-1)',
                    borderRadius: '4px',
                    background: 'var(--blue-0)',
                    color: 'var(--blue-5)',
                    padding: '4px 8px',
                  }}
                >
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
            <div className="flex align-items-center gap-1 justify-content-end">
              <BsCheck style={{ color: 'var(--green)' }} size={20} />
              <span className="white-space-nowrap">
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
