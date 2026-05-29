import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import {
  RagEmporixEmbeddingConfig,
  RagLlmProvider,
  ToolConfig,
} from '../../types/Tool'
import { EntityTypeOption } from '../../types/Schema'
import { resolveRagEntityType } from '../../utils/ragEmporixToolHelpers'
import { ToolTokenSelect } from './ToolTokenSelect'
import { ToolRequiredMark } from './ToolRequiredMark'

interface RagEmporixToolSectionProps {
  config: ToolConfig
  isEditing: boolean
  availableTokens: Array<{ id: string; name: string }>
  entityTypeOptions: EntityTypeOption[]
  entityTypesLoading?: boolean
  onEntityTypeChange: (value: string) => void
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
  onEmbeddingDimensionsChange: (value: number | null) => void
}

export const RagEmporixToolSection: React.FC<RagEmporixToolSectionProps> = ({
  config,
  isEditing,
  availableTokens,
  entityTypeOptions,
  entityTypesLoading = false,
  onNestedConfigChange,
  onEntityTypeChange,
  onDeeplyNestedConfigChange,
  onEmbeddingDimensionsChange,
}) => {
  const { t } = useTranslation()
  const embeddingConfig = (config.embeddingConfig ||
    {}) as RagEmporixEmbeddingConfig
  const dimensionsValue = embeddingConfig.dimensions
    ? Number(embeddingConfig.dimensions)
    : 0
  const isDimensionsInvalid =
    embeddingConfig.dimensions === null ||
    embeddingConfig.dimensions === undefined ||
    dimensionsValue < 128 ||
    dimensionsValue > 4096

  const providerOptions = [
    { label: t('llm_provider_openai'), value: RagLlmProvider.OPENAI },
    {
      label: t('llm_provider_emporix_openai'),
      value: RagLlmProvider.EMPORIX_OPENAI,
    },
    {
      label: t('llm_provider_self_hosted_ollama'),
      value: RagLlmProvider.SELF_HOSTED_OLLAMA,
    },
  ]

  const requiresTokenAndModel = (provider?: RagLlmProvider) =>
    provider === RagLlmProvider.OPENAI ||
    provider === RagLlmProvider.SELF_HOSTED_OLLAMA

  const requiresUrl = (provider?: RagLlmProvider) =>
    provider === RagLlmProvider.SELF_HOSTED_OLLAMA

  return (
    <>
      <div className="form-field">
        <label className="field-label">
          {t('provider')}
          <ToolRequiredMark />
        </label>
        <Dropdown
          value={embeddingConfig.provider ?? ''}
          options={providerOptions}
          onChange={(event) =>
            onNestedConfigChange('embeddingConfig', 'provider', event.value)
          }
          className={`w-full${!embeddingConfig.provider ? ' p-invalid' : ''}`}
          placeholder={t('select_provider')}
          appendTo="self"
        />
      </div>

      {requiresTokenAndModel(embeddingConfig.provider) && (
        <>
          <div className="form-field">
            <label className="field-label">
              {t('model')}
              <ToolRequiredMark />
            </label>
            <InputText
              value={embeddingConfig.model ?? ''}
              onChange={(event) =>
                onNestedConfigChange(
                  'embeddingConfig',
                  'model',
                  event.target.value
                )
              }
              className={`w-full${!embeddingConfig.model?.trim() ? ' p-invalid' : ''}`}
              placeholder={t('enter_model')}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('dimensions')}
              <ToolRequiredMark />
            </label>
            <InputNumber
              value={dimensionsValue}
              disabled={isEditing}
              onValueChange={(event) => {
                const numValue =
                  event.value !== null && event.value !== undefined
                    ? event.value
                    : null
                onEmbeddingDimensionsChange(numValue)
              }}
              className={`w-full${isDimensionsInvalid ? ' p-invalid' : ''}`}
              placeholder={t('enter_dimensions')}
            />
            {isDimensionsInvalid && (
              <small className="p-error">{t('dimensions_range')}</small>
            )}
          </div>
        </>
      )}

      {requiresUrl(embeddingConfig.provider) && (
        <div className="form-field">
          <label className="field-label">
            {t('url')}
            <ToolRequiredMark />
          </label>
          <InputText
            value={embeddingConfig.url ?? ''}
            onChange={(event) =>
              onNestedConfigChange('embeddingConfig', 'url', event.target.value)
            }
            className={`w-full${!embeddingConfig.url?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_url')}
          />
        </div>
      )}

      {requiresTokenAndModel(embeddingConfig.provider) && (
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
      )}

      <div className="form-field">
        <label className="field-label">
          {t('entity_type')}
          <ToolRequiredMark />
        </label>
        <Dropdown
          value={resolveRagEntityType(config.entityType)}
          options={entityTypeOptions}
          onChange={(event) => onEntityTypeChange(event.value)}
          className="w-full"
          placeholder={t('select_entity_type')}
          disabled={isEditing}
          appendTo="self"
        />
        {entityTypesLoading && (
          <small className="tool-detail-section-description">
            {t('loading_entity_types')}
          </small>
        )}
      </div>
    </>
  )
}
