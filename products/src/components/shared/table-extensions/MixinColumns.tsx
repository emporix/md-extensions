import { useCallback, useEffect, useState } from 'react'
import { useMixinColumns } from '../../../hooks/useMixinColumns.tsx'
import { SchemaAttributeType, SchemaType } from '../../../models/Schema'
import { Dropdown } from 'primereact'
import { SelectedMixinRow } from './SelectedMixinRow'
import { useConfiguration } from '../../../context/ConfigurationProvider'
import AddCustomMixinDialog from './AddCustomMixinDialog'
import { useTranslation } from 'react-i18next'
import { DisplayMixin } from '../../../models/DisplayMixin'
import { useDashboardContext } from '../../../context/Dashboard.context.tsx'

export const MixinColumns = (props: {
  tableConfigurationKey: string
  managerPermission: boolean
  selectedMixins: DisplayMixin[]
  setSelectedMixins: (mixins: DisplayMixin[]) => unknown
  schemaType: SchemaType | string
}) => {
  const {
    tableConfigurationKey,
    managerPermission,
    selectedMixins,
    setSelectedMixins,
    schemaType,
  } = props
  const { tenant } = useDashboardContext()
  const { t } = useTranslation()
  const { mixinColumns } = useMixinColumns(schemaType)
  const [activeMixinOptions, setActiveMixinOptions] = useState<DisplayMixin[]>(
    []
  )
  const [defaultSelectedMixins, setDefaultSelectedMixins] = useState<
    DisplayMixin[]
  >([])

  const [showAddEditMixinDialog, setShowAddEditMixinDialog] = useState(false)
  const [defaultDisplayMixin, setDefaultDisplayMixin] = useState<DisplayMixin>({
    key: '',
    label: {},
    type: SchemaAttributeType.TEXT,
  })

  const { tableConfigurations, getTableMixinColumns } = useConfiguration()

  useEffect(() => {
    // select previously selected mixins that were save
    const newActiveMixinOptions = mixinColumns
      .filter((mixin) =>
        defaultSelectedMixins.length > 0
          ? defaultSelectedMixins.every((dsm) => mixin.key !== dsm.key)
          : true
      )
      .sort((a, b) => a.key.localeCompare(b.key))
    setActiveMixinOptions(newActiveMixinOptions)
    // show current selected mixins
    setSelectedMixins(defaultSelectedMixins)
  }, [mixinColumns, defaultSelectedMixins])

  useEffect(() => {
    const selectedMixins = getTableMixinColumns(tableConfigurationKey)
    setDefaultSelectedMixins(selectedMixins)
  }, [tenant, tableConfigurationKey, tableConfigurations])

  const handleSaveMixin = useCallback(
    (data: DisplayMixin) => {
      if ((selectedMixins || []).some((mixin) => mixin.key === data.key)) {
        setSelectedMixins(
          selectedMixins.map((mixin) =>
            mixin.key === data.key
              ? {
                  key: data.key,
                  label: data.label,
                  type: data.type,
                }
              : mixin
          )
        )
      } else {
        setSelectedMixins([
          ...selectedMixins,
          {
            key: data.key,
            label: data.label,
            type: data.type,
          },
        ])
        setActiveMixinOptions((prev) =>
          prev.filter((mixin) => mixin.key !== data.key)
        )
      }
    },
    [selectedMixins, setSelectedMixins, setActiveMixinOptions]
  )

  return (
    <>
      <h3 className="mt-4 mb-2">Mixins</h3>
      {selectedMixins?.map((column) => (
        <SelectedMixinRow
          key={column.key}
          mixin={column}
          managerPermission={managerPermission}
          onRemove={() => {
            setActiveMixinOptions(
              [...activeMixinOptions, column].sort((a, b) =>
                a.key.localeCompare(b.key)
              )
            )
            setSelectedMixins(
              selectedMixins.filter((mixin) => mixin.key !== column.key)
            )
          }}
          onEdit={() => {
            setDefaultDisplayMixin(column)
            setShowAddEditMixinDialog(true)
          }}
        />
      ))}
      <div className="flex">
        <Dropdown
          value={null}
          data-test-id="mixin-columns-dropdown"
          onChange={(e) => {
            setActiveMixinOptions((prev: DisplayMixin[]) =>
              prev.filter((mixin) => mixin.key !== e.value.key)
            )
            setSelectedMixins([...selectedMixins, e.value])
          }}
          optionLabel="key"
          filterBy="key"
          filter
          options={activeMixinOptions}
          placeholder={t('tableExtensions.selectMixin')}
          className="w-full mt-2"
        />
      </div>
      {/*
      Button is disabled for now until we figure out how to present it to client in more clear and understandable way
      <Button
        label={t('tableExtensions.addCustomMixin')}
        className="p-button-secondary mt-4"
        data-test-id="mixin-columns-add-custom-mixin-button"
        onClick={() => {
          setDefaultDisplayMixin({
            key: '',
            label: {},
            type: SchemaAttributeType.TEXT,
          })
          setShowAddEditMixinDialog(true)
        }}
      /> */}
      <AddCustomMixinDialog
        isOpen={showAddEditMixinDialog}
        defaultDisplayMixin={defaultDisplayMixin}
        handleSubmit={handleSaveMixin}
        onClose={() => {
          setShowAddEditMixinDialog(false)
        }}
      />
    </>
  )
}
