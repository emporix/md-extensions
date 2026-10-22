import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import {
  CUSTOMER_ENTITY_TYPE,
  LEGAL_ENTITY_ENTITY_TYPE,
  ToolConfig,
} from '../../types/Tool'
import { resolveSearchEntityType } from '../../utils/toolConfigHelpers'
import { ToolRequiredMark } from './ToolRequiredMark'

interface SearchToolSectionProps {
  config: ToolConfig
  onConfigChange: (key: string, value: string) => void
}

export const SearchToolSection: React.FC<SearchToolSectionProps> = ({
  config,
  onConfigChange,
}) => {
  const { t } = useTranslation()
  const maxResults = Number(config.maxResults ?? 5)
  const isMaxResultsInvalid =
    !Number.isInteger(maxResults) || maxResults < 1 || maxResults > 10

  const entityTypeOptions = [
    { label: t('customer'), value: CUSTOMER_ENTITY_TYPE },
    { label: t('legal_entity'), value: LEGAL_ENTITY_ENTITY_TYPE },
  ]

  return (
    <>
      <div className="form-field">
        <label className="field-label">
          {t('entity_type')}
          <ToolRequiredMark />
        </label>
        <Dropdown
          value={resolveSearchEntityType(config.entityType)}
          options={entityTypeOptions}
          onChange={(event) => onConfigChange('entityType', event.value)}
          className="w-full"
          placeholder={t('select_entity_type')}
          appendTo="self"
        />
      </div>
      <div className="form-field">
        <label className="field-label">
          {t('max_results')}
          <ToolRequiredMark />
        </label>
        <InputNumber
          value={Number.isFinite(maxResults) ? maxResults : null}
          onValueChange={(event) =>
            onConfigChange('maxResults', String(event.value ?? 5))
          }
          className={`w-full${isMaxResultsInvalid ? ' p-invalid' : ''}`}
          placeholder={t('enter_search_max_results')}
          min={1}
          max={10}
          useGrouping={false}
        />
        {isMaxResultsInvalid && (
          <small className="p-error">{t('search_max_results_range')}</small>
        )}
      </div>
    </>
  )
}
