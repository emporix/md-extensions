import { useEffect, useMemo, useState } from 'react'
import { Dialog, InputText, PrimaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import LocalizedInput from './LocalizedInput'
import type Localized from '../../models/Localized.model'
import type { DisplayMixin } from '../../models/DisplayMixin'
import { SchemaAttributeType } from '../../models/Schema.model'
import styles from './AddCustomMixinDialog.module.scss'

type AddCustomMixinDialogProps = {
  readonly isOpen: boolean
  readonly onClose: () => unknown
  readonly handleSubmit: (data: DisplayMixin) => unknown
  readonly defaultDisplayMixin?: DisplayMixin
}

const AddCustomMixinDialog = ({
  isOpen,
  onClose,
  handleSubmit,
  defaultDisplayMixin,
}: AddCustomMixinDialogProps) => {
  const { t } = useTranslation()
  const [customMixinLabel, setCustomMixinLabel] = useState<Localized>({})
  const [customMixinKey, setCustomMixinKey] = useState('')

  const isEdit = Boolean(defaultDisplayMixin?.key)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    // MixinColumns passes EMPTY_MIXIN (`key: ''`) for create. That object is
    // truthy, so reset whenever there is no mixin key — not only when the
    // prop is omitted.
    if (defaultDisplayMixin?.key) {
      setCustomMixinLabel(defaultDisplayMixin.label)
      setCustomMixinKey(defaultDisplayMixin.key)
      return
    }
    setCustomMixinLabel({})
    setCustomMixinKey('')
  }, [defaultDisplayMixin, isOpen])

  const isValid = useMemo(
    () => Object.keys(customMixinLabel).length > 0 && Boolean(customMixinKey),
    [customMixinLabel, customMixinKey]
  )

  const suffix = isEdit ? 'Edit' : 'Create'

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      style={{ width: '28rem' }}
      header={t(`global.tableExtensions.addCustomMixinDialog.title${suffix}`)}
      footer={
        <PrimaryButton
          className={styles.confirmButton}
          data-testid="add-custom-mixin-dialog-confirm-button"
          disabled={!isValid}
          onClick={() => {
            handleSubmit({
              key: customMixinKey,
              label: customMixinLabel,
              type: SchemaAttributeType.TEXT,
            })
            onClose()
          }}
        >
          {t(`global.tableExtensions.addCustomMixinDialog.confirm${suffix}`)}
        </PrimaryButton>
      }
    >
      <LocalizedInput
        className={styles.field}
        label={t('global.tableExtensions.addCustomMixinDialog.columnLabel')}
        value={customMixinLabel}
        onChange={(val) => setCustomMixinLabel(val ?? {})}
      />
      <InputText
        className={styles.field}
        label={t('global.tableExtensions.addCustomMixinDialog.columnKey')}
        value={customMixinKey}
        data-testid="add-custom-mixin-dialog-column-key-input"
        onChange={(e) => setCustomMixinKey(e.target.value)}
      />
    </Dialog>
  )
}

export default AddCustomMixinDialog
