import { useCallback, useMemo, useState } from 'react'
import { Dropdown, SecondaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import SelectedMixinRow from './SelectedMixinRow'
import AddCustomMixinDialog from './AddCustomMixinDialog'
import { useMixinColumns } from '../../hooks/useMixinColumns'
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
  readonly managerPermission: boolean
  /** Draft of the mixin columns, owned by the table (reset when the panel opens). */
  readonly selectedMixins: DisplayMixin[]
  readonly setSelectedMixins: (mixins: DisplayMixin[]) => unknown
  readonly schemaType: SchemaType | string
}

/**
 * Picks which mixin values are surfaced as extra columns on a DataTable
 * (MD `table-extensions/MixinColumns`). Rendered in the component library
 * `TableExtensions` `children` slot; the draft and its save live in the table.
 */
export const MixinColumns = ({
  managerPermission,
  selectedMixins,
  setSelectedMixins,
  schemaType,
}: MixinColumnsProps) => {
  const { t } = useTranslation()
  const { mixinColumns } = useMixinColumns(schemaType)
  const { isToggleValid } = useFeatureToggles()

  const [showAddEditMixinDialog, setShowAddEditMixinDialog] = useState(false)
  const [defaultDisplayMixin, setDefaultDisplayMixin] =
    useState<DisplayMixin>(EMPTY_MIXIN)

  // Offer the tenant's mixins that are not columns yet, sorted by key.
  const activeMixinOptions = useMemo(
    () =>
      mixinColumns
        .filter((mixin) =>
          selectedMixins.every((selected) => mixin.key !== selected.key)
        )
        .sort((a, b) => a.key.localeCompare(b.key)),
    [mixinColumns, selectedMixins]
  )

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
        itemTemplate={(option) => <span title={option.key}>{option.key}</span>}
        onChange={(e) => {
          const picked = activeMixinOptions.find(
            (mixin) => mixin.key === e.value
          )
          if (!picked) {
            return
          }
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
