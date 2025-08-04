import { useState, useEffect, useCallback } from 'react';
import { CustomAgent } from '../types/Agent';
import { AgentService } from '../services/agentService';
import { AppState } from '../types/common';
import { getLocalizedValue } from '../utils/agentHelpers';

interface UseAgentConfigProps {
  agent: CustomAgent | null;
  appState: AppState;
  onSave: (agent: CustomAgent) => void;
  onHide: () => void;
}

interface AgentConfigState {
  agentId: string;
  agentName: string;
  description: string;
  triggerType: string;
  prompt: string;
  model: string;
  temperature: string;
  maxTokens: string;
  provider: string;
  apiKey: string;
  recursionLimit: string;
  enableMemory: boolean;
  selectedIcon: string;
  mcpServers: any[];
  nativeTools: any[];
<<<<<<< Updated upstream
=======
  agentCollaborations: any[];
>>>>>>> Stashed changes
  tags: string[];
}

export const useAgentConfig = ({ agent, appState, onSave, onHide }: UseAgentConfigProps) => {
  const [state, setState] = useState<AgentConfigState>({
    agentId: '',
    agentName: '',
    description: '',
    triggerType: 'endpoint',
    prompt: '',
    model: '',
    temperature: '0',
    maxTokens: '0',
    provider: 'emporix_openai',
    apiKey: '',
    recursionLimit: '20',
    enableMemory: true,
    selectedIcon: 'robot',
    mcpServers: [],
    nativeTools: [],
<<<<<<< Updated upstream
=======
    agentCollaborations: [],
>>>>>>> Stashed changes
    tags: []
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setState({
        agentId: agent.id,
        agentName: getLocalizedValue(agent.name, 'en'),
        description: getLocalizedValue(agent.description, 'en'),
        triggerType: (agent.trigger?.type as string)?.toLowerCase() || 'endpoint',
        prompt: agent.userPrompt || '',
        model: agent.llmConfig?.model || '',
        temperature: agent.llmConfig?.temperature?.toString() || '0',
        maxTokens: agent.llmConfig?.maxTokens?.toString() || '0',
        provider: agent.llmConfig?.provider || 'emporix_openai',
        apiKey: agent.llmConfig?.apiKey || '',
        recursionLimit: agent.maxRecursionLimit?.toString() || '20',
        enableMemory: agent.enableMemory !== undefined ? !!agent.enableMemory : true,
        selectedIcon: agent.icon || 'robot',
        mcpServers: agent.mcpServers || [],
        nativeTools: agent.nativeTools || [],
<<<<<<< Updated upstream
=======
        agentCollaborations: agent.agentCollaborations || [],
>>>>>>> Stashed changes
        tags: agent.tags || []
      });
    }
  }, [agent]);

  const updateField = useCallback((field: keyof AgentConfigState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!agent) return;

    setSaving(true);
    
    const updatedAgent: CustomAgent = {
      ...agent,
      id: state.agentId || '',
      name: { en: state.agentName || '' },
      description: { en: state.description || '' },
      trigger: { 
        ...agent.trigger, 
        type: state.triggerType || 'endpoint',
        config: agent.trigger?.config || null
      },
      userPrompt: state.prompt || '',
      llmConfig: {
        model: state.model || '',
        temperature: parseFloat(state.temperature) || 0,
        maxTokens: parseInt(state.maxTokens, 10) || 0,
        provider: state.provider,
        additionalParams: agent.llmConfig?.additionalParams || null,
        ...(state.provider !== 'emporix_openai' && { apiKey: state.apiKey || '' })
      },
      maxRecursionLimit: parseInt(state.recursionLimit, 10) || 20,
      enableMemory: state.enableMemory,
      mcpServers: state.mcpServers || [],
      nativeTools: state.nativeTools || [],
<<<<<<< Updated upstream
=======
      agentCollaborations: state.agentCollaborations || [],
>>>>>>> Stashed changes
      enabled: agent.enabled || false,
      metadata: agent.metadata || {
        version: 1,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        schema: null,
        mixins: {}
      },
      icon: state.selectedIcon,
      tags: state.tags || []
    };

    try {
      const agentService = new AgentService(appState);
      const savedAgent = await agentService.upsertCustomAgent(updatedAgent);
      setSaving(false);
      onSave(savedAgent);
      onHide();
    } catch (e) {
      console.error('Error saving agent:', e);
      setSaving(false);
    }
  }, [agent, state, appState, onSave, onHide]);

  const isFormValid = useCallback(() => {
    const isCreating = !agent?.id;
    const isEmporixProvider = state.provider === 'emporix_openai';
    
    const basicValidation = (
      state.agentName.trim() &&
      state.description.trim() &&
      state.prompt.trim() &&
      state.model.trim()
    );

    // API key validation:
    // - Never required for emporix_openai
    // - Only required when creating (not updating) for other providers
    const apiKeyValidation = isEmporixProvider || !isCreating || state.apiKey.trim();

    return basicValidation && apiKeyValidation;
  }, [state, agent?.id]);

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid()
  };
}; 