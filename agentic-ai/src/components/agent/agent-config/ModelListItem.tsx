import React from 'react'
import { useTranslation } from 'react-i18next'
import { LlmModel } from '../../../types/Model'

interface ModelListItemProps {
  model: LlmModel
  isSelected: boolean
  onSelect: (modelId: string) => void
}

export const ModelListItem: React.FC<ModelListItemProps> = ({
  model,
  isSelected,
  onSelect,
}) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      data-model-id={model.id}
      className={`agent-detail-model-list-item${isSelected ? ' agent-detail-model-list-item--selected' : ''}`}
      onClick={() => onSelect(model.id)}
      aria-pressed={isSelected}
    >
      <span
        className={`agent-detail-model-radio${isSelected ? ' agent-detail-model-radio--selected' : ''}`}
        aria-hidden="true"
      />
      <span className="agent-detail-model-list-content">
        <span className="agent-detail-model-list-title-row">
          <span className="agent-detail-model-list-title">{model.name}</span>
          {model.thinking && (
            <span className="agent-detail-model-thinking-badge">
              {t('model_thinking_badge')}
            </span>
          )}
        </span>
        {model.description && (
          <span className="agent-detail-model-list-description">
            {model.description}
          </span>
        )}
      </span>
    </button>
  )
}
