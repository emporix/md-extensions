import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'

interface ErrorStepProps {
  onOk: () => void
  errorMessage?: string
}

export const ErrorStep: React.FC<ErrorStepProps> = ({ onOk, errorMessage }) => {
  const { t } = useTranslation()

  return (
    <div className="add-agent-error-state">
      <div className="error-icon">❌</div>
      <h2 className="dialog-title">{t('error_creating_agent')}</h2>
      <p className="error-description">
        {errorMessage || t('agent_creation_failed')}
      </p>
      <div className="dialog-actions">
        <Button type="button" label={t('ok')} onClick={onOk} />
      </div>
    </div>
  )
}
