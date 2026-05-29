import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputNumber } from 'primereact/inputnumber'
import { ToolConfig } from '../../types/Tool'
import { ToolRequiredMark } from './ToolRequiredMark'

interface RagCustomResultsSectionProps {
  config: ToolConfig
  onConfigChange: (key: string, value: string) => void
}

export const RagCustomResultsSection: React.FC<
  RagCustomResultsSectionProps
> = ({ config, onConfigChange }) => {
  const { t } = useTranslation()
  const maxResults = config.maxResults ?? 5
  const isMaxResultsInvalid = maxResults < 1 || maxResults > 100

  return (
    <div className="form-field">
      <label className="field-label">
        {t('max_results')}
        <ToolRequiredMark />
      </label>
      <InputNumber
        value={maxResults}
        onValueChange={(event) =>
          onConfigChange('maxResults', String(event.value ?? 5))
        }
        className={`w-full${isMaxResultsInvalid ? ' p-invalid' : ''}`}
        placeholder={t('enter_max_results')}
        min={1}
        max={100}
      />
      {isMaxResultsInvalid && (
        <small className="p-error">{t('max_results_range')}</small>
      )}
    </div>
  )
}
