import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { ToolConfig } from '../../types/Tool'
import { ToolRequiredMark } from './ToolRequiredMark'

interface SlackToolSectionProps {
  config: ToolConfig
  isCreating: boolean
  onConfigChange: (key: string, value: string) => void
}

export const SlackToolSection: React.FC<SlackToolSectionProps> = ({
  config,
  isCreating,
  onConfigChange,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="form-field">
        <label className="field-label">
          {t('team_id')}
          <ToolRequiredMark />
        </label>
        <InputText
          value={config.teamId ?? ''}
          onChange={(event) => onConfigChange('teamId', event.target.value)}
          className={`w-full${!config.teamId?.trim() ? ' p-invalid' : ''}`}
          placeholder={t('enter_team_id')}
        />
      </div>

      {isCreating && (
        <div className="form-field">
          <label className="field-label">
            {t('bot_token')}
            <ToolRequiredMark />
          </label>
          <InputText
            value={config.botToken ?? ''}
            onChange={(event) => onConfigChange('botToken', event.target.value)}
            className={`w-full${!config.botToken?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_bot_token')}
            type="password"
          />
        </div>
      )}
    </>
  )
}
