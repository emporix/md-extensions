import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { ToolConfig } from '../../types/Tool'
import { ToolTokenSelect } from './ToolTokenSelect'
import { ToolRequiredMark } from './ToolRequiredMark'

interface RagCustomEmbeddingSectionProps {
  config: ToolConfig
  availableTokens: Array<{ id: string; name: string }>
  onNestedConfigChange: (
    parentKey: string,
    childKey: string,
    value: string
  ) => void
  onDeeplyNestedConfigChange: (
    parentKey: string,
    childKey: string,
    grandchildKey: string,
    value: string
  ) => void
}

export const RagCustomEmbeddingSection: React.FC<
  RagCustomEmbeddingSectionProps
> = ({
  config,
  availableTokens,
  onNestedConfigChange,
  onDeeplyNestedConfigChange,
}) => {
  const { t } = useTranslation()
  const embeddingConfig = config.embeddingConfig || {}

  return (
    <div className="tool-detail-form-row">
      <div className="form-field">
        <label className="field-label">
          {t('model')}
          <ToolRequiredMark />
        </label>
        <InputText
          value={embeddingConfig.model ?? ''}
          onChange={(event) =>
            onNestedConfigChange('embeddingConfig', 'model', event.target.value)
          }
          className={`w-full${!embeddingConfig.model?.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_model')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('token')}
          <ToolRequiredMark />
        </label>
        <ToolTokenSelect
          value={embeddingConfig.token?.id ?? ''}
          tokens={availableTokens}
          onChange={(tokenId) =>
            onDeeplyNestedConfigChange(
              'embeddingConfig',
              'token',
              'id',
              tokenId
            )
          }
          invalid={!embeddingConfig.token?.id}
        />
      </div>
    </div>
  )
}
