import React from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from 'primereact/progressbar'
import { Button } from 'primereact/button'
import { LocalizedString } from '../../../types/Agent'
import { getLocalizedValue } from '../../../utils/agentHelpers'
import { AppState } from '../../../types/common'

interface LoadingStepProps {
  agentName: LocalizedString
  progress: number
  onDiscard: () => void
  appState: AppState
}

export const LoadingStep: React.FC<LoadingStepProps> = ({
  agentName,
  progress,
  onDiscard,
  appState,
}) => {
  const { t } = useTranslation()

  return (
    <div className="add-agent-loading-state">
      <div className="agent-icon">🎧</div>
      <h2 className="dialog-title">
        {getLocalizedValue(agentName, appState.contentLanguage)}{' '}
        {t('being_copied')}
      </h2>
      <ProgressBar value={progress} />
      <p className="loading-hint">{t('please_wait')}</p>
      <div className="loading-actions">
        <Button
          type="button"
          label={t('cancel')}
          onClick={onDiscard}
          className="p-button-secondary"
        />
      </div>
    </div>
  )
}
