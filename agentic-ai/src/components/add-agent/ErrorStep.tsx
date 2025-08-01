import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';

interface ErrorStepProps {
  onOk: () => void;
}

export const ErrorStep: React.FC<ErrorStepProps> = ({ onOk }) => {
  const { t } = useTranslation();

  return (
    <div className="add-agent-error-state">
      <div className="agent-icon" style={{ margin: '2rem auto 1.5rem auto' }}>❌</div>
      <h2 className="dialog-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {t('error_creating_agent', 'Error Creating Agent')}
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        {t('agent_creation_failed', 'There was an error creating your agent. Please try again.')}
      </p>
      <div style={{ textAlign: 'center' }}>
        <Button
          label={t('ok')}
          onClick={onOk}
          className="discard-button"
        />
      </div>
    </div>
  );
}; 