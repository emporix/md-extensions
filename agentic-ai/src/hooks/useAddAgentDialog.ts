import { useState, useEffect, useCallback } from 'react';
import { AgentTemplate } from '../types/Agent';
import { AgentService } from '../services/agentService';
import { AppState } from '../types/common';
import { getLocalizedValue } from '../utils/agentHelpers';

type Step = 'form' | 'loading' | 'success' | 'error';

interface UseAddAgentDialogProps {
  agentTemplate: AgentTemplate | null;
  appState: AppState;
  onSave: (name: string, description: string, templateId: string) => void;
  onHide: () => void;
}

export const useAddAgentDialog = ({ 
  agentTemplate, 
  appState, 
  onSave, 
  onHide 
}: UseAddAgentDialogProps) => {
  const [step, setStep] = useState<Step>('form');
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (agentTemplate) {
      setAgentName(getLocalizedValue(agentTemplate.name, 'en'));
      setDescription(getLocalizedValue(agentTemplate.description, 'en'));
    }
  }, [agentTemplate]);

  const handleSave = useCallback(async () => {
    if (!agentTemplate) return;

    setStep('loading');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const agentService = new AgentService(appState);
      await agentService.copyTemplate(
        agentTemplate.id,
        agentId,
        agentName,
        description
      );

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setStep('success');
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error creating agent:', error);
      setStep('error');
    }
  }, [agentId, agentName, description, agentTemplate, appState]);

  const handleOk = useCallback(() => {
    if (step === 'success') {
      onSave(agentName, description, agentTemplate?.id || '');
    }
    onHide();
    setStep('form');
    setProgress(0);
  }, [step, agentName, description, agentTemplate, onSave, onHide]);

  const handleDiscard = useCallback(() => {
    onHide();
    setStep('form');
    setProgress(0);
    setAgentId('');
    setAgentName('');
    setDescription('');
  }, [onHide]);

  const resetForm = useCallback(() => {
    setStep('form');
    setProgress(0);
    setAgentId('');
    if (agentTemplate) {
      setAgentName(getLocalizedValue(agentTemplate.name, 'en'));
      setDescription(getLocalizedValue(agentTemplate.description, 'en'));
    }
  }, [agentTemplate]);

  return {
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
  };
}; 