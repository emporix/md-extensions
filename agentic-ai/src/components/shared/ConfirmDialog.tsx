import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { formatMessageWithLineBreaks } from '../../utils/formatHelpers.tsx'

interface ConfirmDialogProps {
  visible: boolean
  onHide: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  severity?: 'danger' | 'warning' | 'info' | 'primary'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  severity = 'danger',
}) => {
  const { t } = useTranslation()

  const confirmButtonClass = useMemo(() => {
    switch (severity) {
      case 'danger':
        return 'p-button-danger'
      case 'warning':
        return 'p-button-warning'
      default:
        return 'p-button-primary'
    }
  }, [severity])

  const formattedMessage = useMemo(() => {
    const formatted = formatMessageWithLineBreaks(message)
    if (typeof formatted === 'string') {
      return <p>{formatted}</p>
    }
    return formatted
  }, [message])

  const footer = (
    <div className="dialog-actions">
      <Button
        type="button"
        label={cancelLabel || t('cancel')}
        onClick={onHide}
        className="p-button-secondary"
      />
      <Button
        type="button"
        label={confirmLabel || t('delete')}
        onClick={onConfirm}
        className={confirmButtonClass}
      />
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={title}
      footer={footer}
      className="confirm-dialog"
      modal
      closeOnEscape
      closable
    >
      {formattedMessage}
    </Dialog>
  )
}
