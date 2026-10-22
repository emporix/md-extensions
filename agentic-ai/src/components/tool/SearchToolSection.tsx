import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, InputText } from '@emporix/component-library'
import {
  CUSTOMER_ENTITY_TYPE,
  LEGAL_ENTITY_ENTITY_TYPE,
  ToolConfig,
} from '../../types/Tool'
import { resolveSearchEntityType } from '../../utils/toolConfigHelpers'

interface SearchToolSectionProps {
  config: ToolConfig
  onConfigChange: (key: string, value: string) => void
}

const ENTITY_TYPE_INPUT_ID = 'search-entity-type'
const MAX_RESULTS_INPUT_ID = 'search-max-results'

export const SearchToolSection: React.FC<SearchToolSectionProps> = ({
  config,
  onConfigChange,
}) => {
  const { t } = useTranslation()
  const maxResultsValue =
    config.maxResults === undefined || config.maxResults === null
      ? '5'
      : String(config.maxResults)
  const parsedMaxResults = Number(maxResultsValue)
  const isMaxResultsInvalid =
    maxResultsValue.trim() === '' ||
    !Number.isInteger(parsedMaxResults) ||
    parsedMaxResults < 1 ||
    parsedMaxResults > 10

  const entityTypeOptions = [
    { label: t('customer'), value: CUSTOMER_ENTITY_TYPE },
    { label: t('legal_entity'), value: LEGAL_ENTITY_ENTITY_TYPE },
  ]

  return (
    <>
      <div className="form-field">
        <Dropdown
          inputId={ENTITY_TYPE_INPUT_ID}
          label={t('entity_type')}
          required
          value={resolveSearchEntityType(config.entityType)}
          options={entityTypeOptions}
          onChange={(event) => {
            if (typeof event.value === 'string') {
              onConfigChange('entityType', event.value)
            }
          }}
          className="w-full"
          placeholder={t('select_entity_type')}
        />
      </div>
      <div className="form-field">
        <InputText
          inputId={MAX_RESULTS_INPUT_ID}
          label={t('max_results')}
          required
          type="number"
          step={1}
          min={1}
          max={10}
          value={maxResultsValue}
          onChange={(event) => onConfigChange('maxResults', event.target.value)}
          className="w-full"
          placeholder={t('enter_search_max_results')}
          error={
            isMaxResultsInvalid ? t('search_max_results_range') : undefined
          }
        />
      </div>
    </>
  )
}
