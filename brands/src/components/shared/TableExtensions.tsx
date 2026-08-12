import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  Dialog,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { BiSlider } from 'react-icons/bi'

import { useConfiguration } from '../../context/ConfigurationProvider'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import type { ColumnVisibility } from '../../models/Configuration.model'
import styles from './TableExtensions.module.scss'

type TableExtensionsProps = {
  /** Column field keys, in display order. */
  readonly tableColumns: string[]
  /** Configuration key the preference is persisted under (e.g. `ext_brands`). */
  readonly tableConfigurationKey: string
  /** Translation prefix for column labels, e.g. `brands.table.columns`. */
  readonly tableName: string
  readonly managerPermission?: boolean
  readonly onSave?: () => void
  readonly className?: string
}

/**
 * Column-visibility control for a DataTable, persisting the user's choice under
 * a tenant configuration key.
 *
 * Ported from management-dashboard. The dashboard rendered the toggles in a
 * PrimeReact Sidebar with InputSwitches; component-library exports neither, so
 * this uses CL's Dialog + Checkbox. The persisted shape is unchanged, so
 * preferences saved from the dashboard still apply.
 */
const TableExtensions = ({
  tableColumns,
  tableConfigurationKey,
  tableName,
  managerPermission = true,
  onSave,
  className = '',
}: TableExtensionsProps) => {
  const { t, i18n } = useTranslation()
  const { showError } = useToast()
  const { setRefreshValue } = useRefresh()
  const {
    fetchTableConfiguration,
    updateTableConfiguration,
    tableConfigurations,
  } = useConfiguration()

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [columns, setColumns] = useState<ColumnVisibility[]>([])

  useEffect(() => {
    const saved = fetchTableConfiguration(tableConfigurationKey)

    setColumns(
      tableColumns.map((tableColumn) => ({
        key: tableColumn,
        label: t(`${tableName}.${tableColumn}`),
        // No saved entry means the column has never been hidden.
        visible:
          saved.find((savedCol) => savedCol.key === tableColumn)?.visible ??
          true,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableConfigurationKey, tableConfigurations, i18n.language])

  const saveTableConfig = useCallback(async () => {
    try {
      await makeCall(
        () =>
          updateTableConfiguration(tableConfigurationKey, {
            table: { columns: [...columns] },
          }),
        setIsSaving
      )
      setIsOpen(false)
      setRefreshValue()
      onSave?.()
    } catch (e: unknown) {
      showError(t('global.tableExtensions.saveError'), getApiErrorDetails(e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, tableConfigurationKey])

  const toggleColumn = (index: number, visible: boolean) => {
    setColumns((prev) =>
      prev.map((column, i) => (i === index ? { ...column, visible } : column))
    )
  }

  return (
    <div className={className}>
      <SecondaryButton
        size="small"
        iconOnly
        onClick={() => setIsOpen(true)}
        aria-label={t('global.tableExtensions.columns')}
        data-testid="table-extensions-open"
      >
        <BiSlider size={18} aria-hidden />
      </SecondaryButton>
      <Dialog
        visible={isOpen}
        onHide={() => setIsOpen(false)}
        header={t('global.tableExtensions.columns')}
        style={{ width: '22rem' }}
        footer={
          <div className={styles.footer}>
            <SecondaryButton onClick={() => setIsOpen(false)}>
              {t('global.cancel')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!managerPermission || isSaving}
              onClick={saveTableConfig}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      >
        <div className={styles.columns}>
          {columns.map((column, index) => (
            <div key={column.key} className={styles.column}>
              <Checkbox
                inputId={`column-${column.key}`}
                checked={column.visible}
                disabled={!managerPermission}
                onChange={(event) => toggleColumn(index, !!event.checked)}
                data-testid={`column-toggle-${column.key}`}
              />
              <label htmlFor={`column-${column.key}`}>{column.label}</label>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  )
}

export default TableExtensions
