import { useEffect, useMemo, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button, Dialog } from 'primereact'
import { useTranslation } from 'react-i18next'
import { SchemaAttributeType } from '../../../models/Schema'
import InputField from '../InputField'
import { LocalizedInput } from '../LocalizedInput'
import Localized from '../../../models/Localized'
import { DisplayMixin } from '../../../models/DisplayMixin'

type AddCustomMixinDialogProps = {
  isOpen: boolean
  onClose: () => unknown
  handleSubmit: (data: DisplayMixin) => unknown
  defaultDisplayMixin?: DisplayMixin
}

const AddCustomMixinDialog = (props: AddCustomMixinDialogProps) => {
  const { isOpen, onClose, handleSubmit, defaultDisplayMixin } = props
  const { t } = useTranslation()
  const [customMixinLabel, setCustomMixinLabel] = useState<Localized>({})
  const [customMixinKey, setCustomMixinKey] = useState('')
  const isEdit = useMemo(
    () => defaultDisplayMixin?.key !== '',
    [defaultDisplayMixin]
  )

  useEffect(() => {
    if (isOpen && defaultDisplayMixin) {
      setCustomMixinLabel(defaultDisplayMixin.label)
      setCustomMixinKey(defaultDisplayMixin.key)
    }
  }, [defaultDisplayMixin, isOpen])

  const isValid = useMemo(
    () => Object.keys(customMixinLabel).length > 0 && customMixinKey,
    [customMixinLabel, customMixinKey]
  )

  return (
    <Dialog
      visible={isOpen}
      onHide={() => {
        onClose()
      }}
      className="w-4"
      header={
        <h1 className="text-xl text-center mb-4">
          {t(
            `tableExtensions.addCustomMixinDialog.title${
              isEdit ? 'Edit' : 'Create'
            }`
          )}
        </h1>
      }
      footer={
        <Button
          className="w-full mt-4"
          data-test-id="add-custom-mixin-dialog-confirm-button"
          disabled={!isValid}
          onClick={() => {
            handleSubmit({
              key: customMixinKey,
              label: customMixinLabel,
              type: SchemaAttributeType.TEXT,
            })
            onClose()
          }}
          label={t(
            `tableExtensions.addCustomMixinDialog.confirm${
              isEdit ? 'Edit' : 'Create'
            }`
          )}
        />
      }
      closeOnEscape
    >
      <InputField
        className="w-full"
        label={t('tableExtensions.addCustomMixinDialog.columnLabel')}
      >
        <LocalizedInput
          value={customMixinLabel}
          onChange={(val) => setCustomMixinLabel(val || {})}
        />
      </InputField>
      <InputField
        className="w-full mt-2"
        label={t('tableExtensions.addCustomMixinDialog.columnKey')}
      >
        <InputText
          value={customMixinKey}
          data-test-id="add-custom-mixin-dialog-column-key-input"
          className="w-full"
          onChange={(e) => {
            setCustomMixinKey(e.target.value)
          }}
        />
      </InputField>
    </Dialog>
  )
}

export default AddCustomMixinDialog
