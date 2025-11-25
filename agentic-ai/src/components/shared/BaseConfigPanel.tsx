import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { usePanelAnimation } from '../../hooks/usePanelAnimation'

interface BaseConfigPanelProps {
  visible: boolean
  onHide: () => void
  title: string
  icon: IconDefinition
  iconName?: string
  children: React.ReactNode
  onSave?: () => void
  onCancel?: () => void
  saving?: boolean
  canSave?: boolean
  saveLabel?: string
  cancelLabel?: string
  className?: string
}

export const BaseConfigPanel: React.FC<BaseConfigPanelProps> = ({
  visible,
  onHide,
  title,
  icon,
  iconName,
  children,
  onSave,
  onCancel,
  saving = false,
  canSave = true,
  saveLabel,
  cancelLabel,
  className = '',
}) => {
  const { t } = useTranslation()

  const { isVisible, isClosing, handleClose, handleBackdropClick } =
    usePanelAnimation({
      visible,
      onHide,
    })

  if (!isVisible) return null

  const handleSaveClick = () => {
    if (onSave && canSave && !saving) {
      onSave()
    }
  }

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel()
    } else {
      handleClose()
    }
  }

  return (
    <>
      <div
        className={`agent-config-backdrop ${!isClosing ? 'backdrop-visible' : ''}`}
        onClick={handleBackdropClick}
      />

      <div className={`agent-config-panel ${className}`}>
        <div className="agent-config-header">
          <h2 className="panel-title">{title}</h2>
        </div>

        <div className="agent-config-content">
          {iconName && (
            <div className="agent-config-icon-row">
              <div className="agent-icon">
                <FontAwesomeIcon icon={icon} />
              </div>
              <div className="agent-config-name-block">
                <h3 className="agent-config-name">{iconName}</h3>
              </div>
            </div>
          )}

          {children}

          <div className="panel-actions">
            <Button
              label={cancelLabel || t('cancel', 'Cancel')}
              className="p-button-text"
              onClick={handleCancelClick}
              disabled={saving}
            />
            {onSave && (
              <Button
                label={saveLabel || t('save', 'Save')}
                className="p-button-primary"
                onClick={handleSaveClick}
                disabled={!canSave || saving}
                loading={saving}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BaseConfigPanel
