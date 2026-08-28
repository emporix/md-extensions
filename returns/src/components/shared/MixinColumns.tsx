import { useCallback, useEffect, useState } from 'react'
import { Dropdown, SecondaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import SelectedMixinRow from './SelectedMixinRow'
import AddCustomMixinDialog from './AddCustomMixinDialog'
import { useMixinColumns } from '../../hooks/useMixinColumns'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useFeatureToggles } from '../../context/FeatureTogglesProvider'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { SchemaAttributeType, SchemaType } from '../../models/Schema.model'
import styles from './MixinColumns.module.scss'

const CUSTOM_MIXIN_COLUMNS_TOGGLE = 'custom-mixin-columns'

const EMPTY_MIXIN: DisplayMixin = {
  key: '',
  label: {},
  type: SchemaAttributeType.TEXT,
}

type MixinColumnsProps = {
  readonly tableConfigurationKey: string
  readonly managerPermission: boolean
  readonly selectedMixins: DisplayMixin[]
  readonly setSelectedMixins: (mixins: DisplayMixin[]) => unknown
  readonly schemaType: SchemaType | string
}

/** Picks which mixin values are surfaced as extra columns on a DataTable. */
export const MixinColumns = ({
  tableConfigurationKey,
  managerPermission,
  selectedMixins,
  setSelectedMixins,
  schemaType,
}: MixinColumnsProps) => {
  const { tenant } = useDashboardContext()
  const { t } = useTranslation()
  const { mixinColumns } = useMixinColumns(schemaType)
  const { tableConfigurations, getTableMixinColumns } = useConfiguration()
  const { isToggleValid } = useFeatureToggles()

  const [activeMixinOptions, setActiveMixinOptions] = useState<DisplayMixin[]>(
    []
  )
  const [defaultSelectedMixins, setDefaultSelectedMixins] = useState<
    DisplayMixin[]
  >([])
  const [showAddEditMixinDialog, setShowAddEditMixinDialog] = useState(false)
  const [defaultDisplayMixin, setDefaultDisplayMixin] =
    useState<DisplayMixin>(EMPTY_MIXIN)

  useEffect(() => {
    setDefaultSelectedMixins(getTableMixinColumns(tableConfigurationKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, tableConfigurationKey, tableConfigurations])

  useEffect(() => {
    // Offer mixins that are not already saved as columns, matching MD MixinColumns.
    setActiveMixinOptions(
      mixinColumns
        .filter((mixin) =>
          defaultSelectedMixins.length > 0
            ? defaultSelectedMixins.every(
                (selected) => mixin.key !== selected.key
              )
            : true
        )
        .sort((a, b) => a.key.localeCompare(b.key))
    )
    setSelectedMixins(defaultSelectedMixins)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixinColumns, defaultSelectedMixins])

  const handleSaveMixin = useCallback(
    (data: DisplayMixin) => {
      if ((selectedMixins || []).some((mixin) => mixin.key === data.key)) {
        setSelectedMixins(
          selectedMixins.map((mixin) =>
            mixin.key === data.key ? { ...data } : mixin
          )
        )
        return
      }
      setSelectedMixins([...selectedMixins, { ...data }])
      setActiveMixinOptions((prev) =>
        prev.filter((mixin) => mixin.key !== data.key)
      )
    },
    [selectedMixins, setSelectedMixins]
  )

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>{t('global.tableExtensions.mixins')}</h3>
      {selectedMixins?.map((column) => (
        <SelectedMixinRow
          key={column.key}
          mixin={column}
          managerPermission={managerPermission}
          onRemove={() => {
            setActiveMixinOptions((prev) =>
              [...prev, column].sort((a, b) => a.key.localeCompare(b.key))
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
      <Dropdown
        value={null}
        filter
        disabled={!managerPermission}
        placeholder={t('global.tableExtensions.selectMixin')}
        options={activeMixinOptions}
        optionLabel="key"
        optionValue="key"
        panelClassName={styles.dropdownPanel}
        itemTemplate={(option) => (
          <span title={option.key}>{option.key}</span>
        )}
        onChange={(e) => {
          const picked = activeMixinOptions.find(
            (mixin) => mixin.key === e.value
          )
          if (!picked) {
            return
          }
          setActiveMixinOptions((prev) =>
            prev.filter((mixin) => mixin.key !== picked.key)
          )
          setSelectedMixins([...selectedMixins, picked])
        }}
        data-testid="mixin-columns-dropdown"
      />

      {isToggleValid(CUSTOM_MIXIN_COLUMNS_TOGGLE) && (
        <SecondaryButton
          className={styles.addCustom}
          disabled={!managerPermission}
          data-testid="mixin-columns-add-custom-mixin-button"
          onClick={() => {
            setDefaultDisplayMixin(EMPTY_MIXIN)
            setShowAddEditMixinDialog(true)
          }}
        >
          {t('global.tableExtensions.addCustomMixin')}
        </SecondaryButton>
      )}

      <AddCustomMixinDialog
        isOpen={showAddEditMixinDialog}
        defaultDisplayMixin={defaultDisplayMixin}
        handleSubmit={handleSaveMixin}
        onClose={() => setShowAddEditMixinDialog(false)}
      />
    </div>
  )
}

export default MixinColumns
