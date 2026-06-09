import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { RagEntityType, ToolConfig } from '../../types/Tool'
import { ToolTokenSelect } from './ToolTokenSelect'
import { ToolRequiredMark } from './ToolRequiredMark'

interface RagCustomDatabaseSectionProps {
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

export const RagCustomDatabaseSection: React.FC<
  RagCustomDatabaseSectionProps
> = ({
  config,
  availableTokens,
  onNestedConfigChange,
  onDeeplyNestedConfigChange,
}) => {
  const { t } = useTranslation()
  const databaseConfig = config.databaseConfig || {}

  const databaseTypes = [{ label: t('qdrant'), value: 'qdrant' }]
  const entityTypes = [{ label: t('product'), value: RagEntityType.PRODUCT }]

  return (
    <>
      <div className="tool-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('database_url')}
            <ToolRequiredMark />
          </label>
          <InputText
            value={databaseConfig.url ?? ''}
            onChange={(event) =>
              onNestedConfigChange('databaseConfig', 'url', event.target.value)
            }
            className={`w-full${!databaseConfig.url?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_database_url')}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('database_type')}
            <ToolRequiredMark />
          </label>
          <Dropdown
            value={databaseConfig.type || 'qdrant'}
            options={databaseTypes}
            onChange={(event) =>
              onNestedConfigChange('databaseConfig', 'type', event.value)
            }
            className="w-full"
            disabled
            appendTo="self"
          />
        </div>
      </div>

      <div className="tool-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('entity_type')}
            <ToolRequiredMark />
          </label>
          <Dropdown
            value={databaseConfig.entityType || RagEntityType.PRODUCT}
            options={entityTypes}
            onChange={(event) =>
              onNestedConfigChange('databaseConfig', 'entityType', event.value)
            }
            className="w-full"
            disabled
            appendTo="self"
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('collection_name')}
            <ToolRequiredMark />
          </label>
          <InputText
            value={databaseConfig.collectionName ?? ''}
            onChange={(event) =>
              onNestedConfigChange(
                'databaseConfig',
                'collectionName',
                event.target.value
              )
            }
            className={`w-full${!databaseConfig.collectionName?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_collection_name')}
          />
        </div>
      </div>

      <div className="form-field tool-detail-form-field-half">
        <label className="field-label">
          {t('token')}
          <ToolRequiredMark />
        </label>
        <ToolTokenSelect
          value={databaseConfig.token?.id ?? ''}
          tokens={availableTokens}
          onChange={(tokenId) =>
            onDeeplyNestedConfigChange('databaseConfig', 'token', 'id', tokenId)
          }
          invalid={!databaseConfig.token?.id}
        />
      </div>
    </>
  )
}
