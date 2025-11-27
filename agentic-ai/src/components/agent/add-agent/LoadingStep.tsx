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
      <div className="agent-icon" style={{ margin: '2rem auto 1.5rem auto' }}>
        🎧
      </div>
      <h2
        className="dialog-title"
        style={{ textAlign: 'center', marginBottom: '2rem' }}
      >
        {getLocalizedValue(agentName, appState.contentLanguage)}{' '}
        {t('being_copied')}
      </h2>
      <ProgressBar value={progress} style={{ height: '6px' }} />
      <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
        {t('please_wait', 'Please wait while we copy the agent template...')}
      </p>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Button
          label={t('cancel')}
          onClick={onDiscard}
          className="discard-button"
        />
      </div>
    </div>
  )
}
