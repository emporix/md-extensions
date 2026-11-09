import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InputSwitch,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { BiSlider } from 'react-icons/bi'

import { useConfiguration } from '../../context/ConfigurationProvider'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { getApiErrorDetails, makeCall } from '../../helpers/api'
import type { ColumnVisibility } from '../../models/Configuration.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import type { SchemaType } from '../../models/Schema.model'
import MixinColumns from './MixinColumns'
import SidePanel from './SidePanel'
import styles from './TableExtensions.module.scss'

type TableExtensionsProps = {
  /** Column field keys, in display order. */
  readonly tableColumns: string[]
  /** Configuration key the preference is persisted under (e.g. `ext_brands`). */
  readonly tableConfigurationKey: string
  /** Explicit column labels, positionally matching `tableColumns`. */
  readonly tableColumnHeaders?: string[]
  /** Translation prefix for column labels, e.g. `brands.table.columns`. */
  readonly tableName: string
  /** When set, mixin values for this schema type can be added as columns. */
  readonly schemaType?: SchemaType | string
  readonly managerPermission?: boolean
  readonly onSave?: () => void
  readonly className?: string
}

/**
 * Column-visibility control for a DataTable, persisting the user's choice under
 * a tenant configuration key.
 *
 * Ported from management-dashboard. MD uses PrimeReact `Sidebar` (right);
 * component-library has no Sidebar, so this uses a local `SidePanel` with the
 * same layout (toggles + mixins + Save). Toggles are CL `InputSwitch`. The
 * persisted shape is unchanged, so preferences saved from the dashboard still
 * apply.
 */
const TableExtensions = ({
  tableColumns,
  tableColumnHeaders,
  tableConfigurationKey,
  tableName,
  schemaType,
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
  const [selectedMixins, setSelectedMixins] = useState<DisplayMixin[]>([])

  useEffect(() => {
    const saved = fetchTableConfiguration(tableConfigurationKey)

    setColumns(
      tableColumns.map((tableColumn, idx) => ({
        key: tableColumn,
        label: tableColumnHeaders?.[idx] ?? t(`${tableName}.${tableColumn}`),
        // No saved entry means the column has never been hidden.
        visible:
          saved.find((savedCol) => savedCol.key === tableColumn)?.visible ??
          true,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tableConfigurationKey,
    tableConfigurations,
    i18n.language,
    tableColumnHeaders,
  ])

  const saveTableConfig = useCallback(async () => {
    try {
      await makeCall(
        () =>
          updateTableConfiguration(tableConfigurationKey, {
            table: { columns: [...columns], mixins: selectedMixins },
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
  }, [columns, selectedMixins, tableConfigurationKey])

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
      <SidePanel
        visible={isOpen}
        onHide={() => setIsOpen(false)}
        ariaLabel={t('global.tableExtensions.columns')}
        data-testid="table-extensions-sidebar"
      >
        <div className={styles.columns}>
          {columns.map((column, index) => (
            <div key={column.key} className={styles.column}>
              <InputSwitch
                inputId={`column-${column.key}`}
                checked={column.visible}
                disabled={!managerPermission}
                onChange={(event) => toggleColumn(index, event.value)}
                data-testid={`column-toggle-${column.key}`}
              />
              <label htmlFor={`column-${column.key}`}>{column.label}</label>
            </div>
          ))}
        </div>
        {schemaType && (
          <MixinColumns
            tableConfigurationKey={tableConfigurationKey}
            managerPermission={managerPermission}
            selectedMixins={selectedMixins}
            setSelectedMixins={setSelectedMixins}
            schemaType={schemaType}
          />
        )}
        <div className={styles.footer}>
          <PrimaryButton
            disabled={!managerPermission || isSaving}
            onClick={saveTableConfig}
            data-testid="table-extensions-save"
          >
            {t('global.save')}
          </PrimaryButton>
        </div>
      </SidePanel>
    </div>
  )
}

export default TableExtensions
