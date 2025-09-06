import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { AgentTemplate } from '../../types/Agent';
import { AppState } from '../../types/common';
import { FormStep } from './add-agent/FormStep';
import { LoadingStep } from './add-agent/LoadingStep';
import { SuccessStep } from './add-agent/SuccessStep';
import { ErrorStep } from './add-agent/ErrorStep';
import { useAddAgentDialog } from '../../hooks/useAddAgentDialog';

interface AddAgentDialogProps {
  visible: boolean;
  agentTemplate: AgentTemplate | null;
  onHide: () => void;
  onSave: (name: string, description: string, templateId: string) => void;
  appState: AppState;
}

const AddAgentDialog: React.FC<AddAgentDialogProps> = memo(({ 
  visible, 
  agentTemplate, 
  onHide, 
  onSave, 
  appState 
}) => {
  const { t } = useTranslation();

  const {
    step,
    agentId,
    agentName,
    description,
    progress,
    setAgentId,
    setAgentName,
    setDescription,
    handleSave,
    handleOk,
    handleDiscard,
    resetForm
  } = useAddAgentDialog({
    agentTemplate,
    appState,
    onSave,
    onHide
  });

  const renderStepContent = () => {
    switch (step) {
      case 'form':
        return (
          <FormStep
            agentId={agentId}
            setAgentId={setAgentId}
            agentName={agentName}
            setAgentName={setAgentName}
            description={description}
            setDescription={setDescription}
            onDiscard={handleDiscard}
            onSave={handleSave}
          />
        );
      case 'loading':
        return (
          <LoadingStep
            agentName={agentName}
            progress={progress}
            onDiscard={handleDiscard}
          />
        );
      case 'success':
        return <SuccessStep onOk={handleOk} />;
      case 'error':
        return <ErrorStep onOk={handleOk} />;
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    if (!agentTemplate) return t('add_agent', 'Add Agent');
    
    return t('add_agent');
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={getDialogTitle()}
      className="add-agent-dialog"
      style={{ width: '80vw', maxWidth: '900px' }}
      modal
      closable={step === 'form'}
      onShow={resetForm}
    >
      {renderStepContent()}
    </Dialog>
  );
});

AddAgentDialog.displayName = 'AddAgentDialog';

export default AddAgentDialog; 