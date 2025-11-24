import React from 'react'
import { useTranslation } from 'react-i18next'
import { AVAILABLE_TAGS } from '../../utils/constants'

interface TagPickerProps {
  visible: boolean
  selectedTag: string | null
  onTagSelect: (tag: string | null) => void
  onClose: () => void
}

export const TagPicker: React.FC<TagPickerProps> = ({
  visible,
  selectedTag,
  onTagSelect,
  onClose,
}) => {
  const { t } = useTranslation()

  if (!visible) return null

  return (
    <div className="tag-picker-overlay" onClick={onClose}>
      <div className="tag-picker-popup" onClick={(e) => e.stopPropagation()}>
        <div className="tag-picker-header">
          <h3>{t('select_tag', 'Select Tag')}</h3>
          <button
            className="tag-picker-close"
            onClick={onClose}
            aria-label={t('close', 'Close')}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
        <div className="tag-picker-grid">
          <button
            className={`tag-picker-item ${!selectedTag ? 'selected' : ''}`}
            onClick={() => {
              onTagSelect(null)
              onClose()
            }}
            aria-label={t('no_tag', 'No Tag')}
          >
            <span className="tag-picker-text">{t('no_tag', 'No Tag')}</span>
          </button>
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              className={`tag-picker-item ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => {
                onTagSelect(tag)
                onClose()
              }}
              aria-label={tag}
            >
              <span className="tag-picker-text">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
