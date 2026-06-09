import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

interface SuccessStepProps {
  onOk: () => void
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ onOk }) => {
  const { t } = useTranslation()

  return (
    <div className="add-agent-success-state">
      <div className="success-icon">
        <FontAwesomeIcon icon={faCheck} />
      </div>
      <h2 className="dialog-title">{t('agent_saved_success')}</h2>
      <div className="dialog-actions">
        <Button
          type="button"
          label={t('discard')}
          onClick={onOk}
          className="p-button-secondary"
          disabled
        />
        <Button type="button" label={t('ok')} onClick={onOk} />
      </div>
    </div>
  )
}
