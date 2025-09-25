import { useState, useEffect, useCallback } from 'react';
import { CustomAgent } from '../types/Agent';
import { AgentService } from '../services/agentService';
import { AppState } from '../types/common';
import { getLocalizedValue } from '../utils/agentHelpers';
import { useToast } from '../contexts/ToastContext';

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
  agentType: string;
  triggerType: string;
  prompt: string;
  templatePrompt: string;
  model: string;
  temperature: string;
  maxTokens: string;
  provider: string;
  tokenId: string;
  recursionLimit: string;
  enableMemory: boolean;
  selectedIcon: string;
  mcpServers: any[];
  nativeTools: any[];
  agentCollaborations: any[];
  tags: string[];
  requiredScopes: string[];
  // Self-hosted LLM parameters
  selfHostedUrl: string;
  selfHostedAuthHeaderName: string;
  selfHostedTokenId: string;
  // Commerce events
  commerceEvents: string[];
}

export const useAgentConfig = ({ agent, appState, onSave, onHide }: UseAgentConfigProps) => {
  const { showSuccess, showError } = useToast();
  const [state, setState] = useState<AgentConfigState>({
    agentId: '',
    agentName: '',
    description: '',
    agentType: 'custom',
    triggerType: 'endpoint',
    prompt: '',
    templatePrompt: '',
    model: '',
    temperature: '0',
    maxTokens: '0',
    provider: 'emporix_openai',
    tokenId: '',
    recursionLimit: '20',
    enableMemory: true,
    selectedIcon: 'robot',
    mcpServers: [],
    nativeTools: [],
    agentCollaborations: [],
    tags: [],
    requiredScopes: [],
    // Self-hosted LLM parameters
    selfHostedUrl: '',
    selfHostedAuthHeaderName: '',
    selfHostedTokenId: '',
    // Commerce events
    commerceEvents: []
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      const agentType = agent.type || 'custom';
      const triggerType = (agent.trigger?.type as string)?.toLowerCase() || 'endpoint';
      
      setState({
        agentId: agent.id,
        agentName: getLocalizedValue(agent.name, 'en'),
        description: getLocalizedValue(agent.description, 'en'),
        agentType: agentType,
        triggerType: agentType === 'support' ? 'slack' : triggerType,
        prompt: agent.userPrompt || '',
        templatePrompt: agent.templatePrompt || '',
        model: agent.llmConfig?.model || '',
        temperature: agent.llmConfig?.temperature?.toString() || '0',
        maxTokens: agent.llmConfig?.maxTokens?.toString() || '0',
        provider: agent.llmConfig?.provider || 'emporix_openai',
        tokenId: agent.llmConfig?.token?.id || '',
        recursionLimit: agent.maxRecursionLimit?.toString() || '20',
        enableMemory: agent.enableMemory !== undefined ? !!agent.enableMemory : true,
        selectedIcon: agent.icon || 'robot',
        mcpServers: agent.mcpServers || [],
        nativeTools: agent.nativeTools || [],
        agentCollaborations: agent.agentCollaborations || [],
        tags: agent.tags || [],
        requiredScopes: agent.requiredScopes || [],
        // Self-hosted LLM parameters
        selfHostedUrl: agent.llmConfig?.selfHostedParams?.url || '',
        selfHostedAuthHeaderName: agent.llmConfig?.selfHostedParams?.authorizationHeaderName || '',
        selfHostedTokenId: (
          typeof agent.llmConfig?.selfHostedParams?.authorizationHeaderToken === 'object' 
            ? agent.llmConfig.selfHostedParams.authorizationHeaderToken.id 
            : agent.llmConfig?.selfHostedParams?.authorizationHeaderToken
        ) || '',
        // Commerce events
        commerceEvents: (agent.trigger?.config?.events as string[]) || []
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
        type: state.agentType === 'support' ? 'slack' : (state.triggerType || 'endpoint'),
        config: state.triggerType === 'commerce_events' 
          ? { events: state.commerceEvents } 
          : null
      },
      userPrompt: state.prompt || '',
      templatePrompt: state.templatePrompt || undefined,
      llmConfig: (() => {
        const baseConfig: any = {
          model: state.model || '',
          temperature: parseFloat(state.temperature) || 0,
          maxTokens: parseInt(state.maxTokens, 10) || 0,
          provider: state.provider,
          additionalParams: agent.llmConfig?.additionalParams || null,
        };

        // Add regular token for non-emporix and non-self-hosted providers
        if (state.provider !== 'emporix_openai' && state.provider !== 'self_hosted_ollama' && state.tokenId) {
          baseConfig.token = { id: state.tokenId };
        }

        // Add selfHostedParams for self-hosted providers
        if (state.provider === 'self_hosted_ollama') {
          baseConfig.selfHostedParams = {
            url: state.selfHostedUrl || '',
          };
          
          if (state.selfHostedAuthHeaderName) {
            baseConfig.selfHostedParams.authorizationHeaderName = state.selfHostedAuthHeaderName;
          }
          
          if (state.selfHostedTokenId) {
            baseConfig.selfHostedParams.authorizationHeaderToken = { id: state.selfHostedTokenId };
          }
        }

        return baseConfig;
      })(),
      maxRecursionLimit: parseInt(state.recursionLimit, 10) || 20,
      enableMemory: state.enableMemory,
      mcpServers: state.mcpServers || [],
      nativeTools: state.nativeTools || [],
      agentCollaborations: state.agentCollaborations || [],
      enabled: agent.enabled || false,
      type: agent.type,
      metadata: agent.metadata || {
        version: 1,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        schema: null,
        mixins: {}
      },
      icon: state.selectedIcon,
      tags: state.tags || [],
      requiredScopes: state.requiredScopes || []
    };

    try {
      const agentService = new AgentService(appState);
      const savedAgent = await agentService.upsertCustomAgent(updatedAgent);
      setSaving(false);
      showSuccess(agent.id ? 'Agent updated successfully!' : 'Agent created successfully!');
      onSave(savedAgent);
      onHide();
    } catch (error) {
      setSaving(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save agent';
      showError(`Error saving agent: ${errorMessage}`);
    }
  }, [agent, state, appState, onSave, onHide]);

  const isFormValid = useCallback(() => {
    const isCreating = !agent?.id;
    const isEmporixProvider = state.provider === 'emporix_openai';
    const isSelfHosted = state.provider === 'self_hosted_ollama';
    
    const basicValidation = (
      state.agentName.trim() &&
      state.description.trim() &&
      state.prompt.trim() &&
      state.model.trim()
    );

    // Token validation:
    // - Never required for emporix_openai or self_hosted_ollama
    // - Only required when creating (not updating) for other providers
    const tokenValidation = isEmporixProvider || isSelfHosted || !isCreating || state.tokenId.trim();

    // Self-hosted validation:
    // - URL is always required for self-hosted
    const selfHostedValidation = !isSelfHosted || state.selfHostedUrl.trim();

    // Commerce events validation:
    // - Events are required when trigger type is commerce_events
    const commerceEventsValidation = state.triggerType !== 'commerce_events' || (state.commerceEvents && state.commerceEvents.length > 0);

    return basicValidation && tokenValidation && selfHostedValidation && commerceEventsValidation;
  }, [state, agent?.id]);

  return {
    state,
    saving,
    updateField,
    handleSave,
    isFormValid: isFormValid()
  };
}; 