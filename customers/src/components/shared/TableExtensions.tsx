import { useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Sidebar } from 'primereact/sidebar'
import { useTranslation } from 'react-i18next'
import { InputSwitch } from 'primereact/inputswitch'
import { BsDownload } from 'react-icons/bs'
import { BiSlider } from 'react-icons/bi'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { makeCall } from '../../helpers/api'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { MixinColumns } from './table-extensions/MixinColumns'
import { SchemaType } from '../../models/Schema'
import { DisplayMixin } from '../../models/DisplayMixin'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface TableExtensionProps {
  csvExportHandler?: () => Promise<void>
  tableColumns: string[]
  tableConfigurationKey: string
  tableName: string
  managerPermission?: boolean | undefined
  onSave?: () => void
  schemaType?: SchemaType | string
}

export interface ColumnVisibility {
  key: string
  label: string
  visible: boolean
}

export function TableExtensions({
  csvExportHandler,
  tableColumns,
  tableConfigurationKey,
  tableName,
  onSave,
  managerPermission = true,
  schemaType,
}: TableExtensionProps) {
  const { tenant } = useDashboardContext()
  const [visible, setVisible] = useState(false)
  const [columns, setColumns] = useState<ColumnVisibility[]>([])
  const { t, i18n } = useTranslation()

  const {
    fetchTableConfiguration,
    updateTableConfiguration,
    tableConfigurations,
  } = useConfiguration()

  const { setRefreshValue } = useRefresh()
  const [isSavingColumns, setIsSavingColumns] = useState(false)
  const [selectedMixins, setSelectedMixins] = useState<DisplayMixin[]>([])

  useEffect(() => {
    ;(async function () {
      const newColumns: ColumnVisibility[] = []
      try {
        const availableColumns: ColumnVisibility[] = fetchTableConfiguration(
          tableConfigurationKey
        )

        tableColumns.forEach((tableColumn) => {
          const foundColumn = availableColumns.find(
            (avCol) => avCol.key === tableColumn
          )
          newColumns.push({
            key: tableColumn,
            label: t(`${tableName}.${tableColumn}`),
            visible: foundColumn ? foundColumn.visible : true,
          })
        })
      } catch (error) {
        tableColumns.forEach((tableColumn) => {
          newColumns.push({
            key: tableColumn,
            label: t(`${tableName}.${tableColumn}`),
            visible: true,
          })
        })
      }
      setColumns(newColumns)
    })()
  }, [tenant, tableConfigurationKey, tableConfigurations, i18n.language])

  const saveTableConfig = useCallback(async () => {
    try {
      await makeCall(
        () =>
          updateTableConfiguration(tenant, tableConfigurationKey, {
            table: {
              columns: [...columns],
              mixins: selectedMixins,
            },
          }),
        setIsSavingColumns
      )
    } finally {
      setVisible(false)
      setRefreshValue()
      if (onSave) {
        onSave()
      }
    }
  }, [columns, tenant, setRefreshValue, selectedMixins])

  return (
    <>
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        position="right"
        appendTo="self"
        data-cy="table_extensions_sidebar"
      >
        <div className="flex flex-column">
          <div className="flex flex-column">
            {columns?.map((column, index) => {
              return (
                <div key={column.key} className="flex align-items-center mt-4">
                  <InputSwitch
                    id={column.key}
                    checked={column.visible}
                    data-cy={column.key}
                    disabled={!managerPermission}
                    onChange={(e) => {
                      const newColumns = [...columns]
                      newColumns[index].visible = e.value
                      setColumns(newColumns)
                    }}
                  />
                  <label htmlFor={column.key} className="ml-2 flex-grow-1">
                    {column.label}
                  </label>
                </div>
              )
            })}
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
          <div className="flex justify-content-end">
            <Button
              disabled={!managerPermission}
              className="mt-4"
              data-cy="table_extensions_sidebar_save_button"
              label={t('global.save')}
              onClick={saveTableConfig}
              loading={isSavingColumns}
            />
          </div>
        </div>
      </Sidebar>
      <div className="flex align-items-center">
        {csvExportHandler && (
          <Button
            className="mr-1 p-button-secondary p-button-icon-only"
            onClick={csvExportHandler}
          >
            <BsDownload size={18} />
          </Button>
        )}
        <Button
          data-cy="table_extensions_sidebar_open_button"
          className="p-button-text p-button-plain p-button-icon-only"
          onClick={() => setVisible(true)}
        >
          <BiSlider size={18} />
        </Button>
      </div>
    </>
  )
}
