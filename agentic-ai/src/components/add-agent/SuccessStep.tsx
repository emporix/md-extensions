import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface SuccessStepProps {
  onOk: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ onOk }) => {
  const { t } = useTranslation();

  return (
    <div className="add-agent-success-state">
      <div className="success-icon">
        <FontAwesomeIcon icon={faCheck} />
      </div>
      <h2 className="dialog-title">
        {t('agent_saved_success', 'Agent Saved to Your List!')}
      </h2>
      <div className="dialog-actions">
        <Button
          label={t('discard', 'DISCARD')}
          onClick={onOk}
          className="discard-button"
          disabled
        />
        <Button
          label={t('ok', 'OK')}
          onClick={onOk}
          className="save-agent-button"
        />
      </div>
    </div>
  );
}; 