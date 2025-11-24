import React from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { iconMap } from '../../utils/agentHelpers'

interface IconPickerProps {
  visible: boolean
  selectedIcon: string
  onIconSelect: (icon: string) => void
  onClose: () => void
}

export const IconPicker: React.FC<IconPickerProps> = ({
  visible,
  selectedIcon,
  onIconSelect,
  onClose,
}) => {
  const { t } = useTranslation()

  if (!visible) return null

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-popup" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header">
          <h3>{t('select_icon', 'Select Icon')}</h3>
          <button
            className="icon-picker-close"
            onClick={onClose}
            aria-label={t('close', 'Close')}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
        <div className="icon-picker-grid">
          {Object.entries(iconMap).map(([key, icon]) => (
            <button
              key={key}
              className={`icon-picker-item ${selectedIcon === key ? 'selected' : ''}`}
              onClick={() => {
                onIconSelect(key)
                onClose()
              }}
              aria-label={key}
            >
              <FontAwesomeIcon icon={icon} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
