import React from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from 'primereact/progressbar'
import { Button } from 'primereact/button'

interface LoadingStepProps {
  agentName: string
  progress: number
  onDiscard: () => void
}

export const LoadingStep: React.FC<LoadingStepProps> = ({
  agentName,
  progress,
  onDiscard,
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
        {agentName} {t('being_copied')}
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
