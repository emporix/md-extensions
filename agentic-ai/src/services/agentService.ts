import { AgentTemplate, CustomAgent } from '../types/Agent';
import { AppState } from '../types/common';
import { ApiClient } from './apiClient';

// Patch operation type
export interface PatchOperation {
  op: 'REPLACE' | 'ADD' | 'REMOVE';
  path: string;
  value?: any;
}

export class AgentService {
  private api: ApiClient;
  private tenant: string;

  constructor(appState: AppState) {
    this.api = new ApiClient(appState);
    this.tenant = appState.tenant;
  } 

  async getAgentTemplates(): Promise<AgentTemplate[]> {
    return await this.api.get<AgentTemplate[]>(`/ai-service/${this.tenant}/agentic/templates`);
  }

  async getCustomAgents(): Promise<CustomAgent[]> {
    return await this.api.get<CustomAgent[]>(`/ai-service/${this.tenant}/agentic/agents`);
  }

  async copyTemplate(templateId: string, id: string, name: string, description: string): Promise<{ success: boolean }> {
    return await this.api.post<{ success: boolean }>(
      `/ai-service/${this.tenant}/agentic/templates/${templateId}/agents`,
      {
        id,
        name: { en: name },
        description: { en: description }
      }
    );
  }

  async upsertCustomAgent(agent: CustomAgent): Promise<CustomAgent> {
    const formattedAgent = {
      id: agent.id,
      name: typeof agent.name === 'string' ? { en: agent.name } : agent.name,
      description: typeof agent.description === 'string' ? { en: agent.description } : agent.description,
      userPrompt: agent.userPrompt,
      trigger: agent.trigger,
      llmConfig: {
        model: agent.llmConfig.model,
        temperature: agent.llmConfig.temperature,
        maxTokens: agent.llmConfig.maxTokens,
        provider: agent.llmConfig.provider,
        additionalParams: agent.llmConfig.additionalParams,
        ...(agent.llmConfig.token && { token: agent.llmConfig.token }),
        ...(agent.llmConfig.selfHostedParams && { selfHostedParams: agent.llmConfig.selfHostedParams })
      },
      mcpServers: agent.mcpServers,
      nativeTools: agent.nativeTools,
      agentCollaborations: agent.agentCollaborations || [],
      maxRecursionLimit: agent.maxRecursionLimit,
      enableMemory: agent.enableMemory,
      enabled: agent.enabled,
      metadata: agent.metadata,
      icon: agent.icon || '',
      tags: agent.tags || []
    };
    
    try {
      return await this.api.put<CustomAgent>(
        `/ai-service/${this.tenant}/agentic/agents/${agent.id}`,
        formattedAgent
      );
    } catch (error) {
      console.error('Error upserting agent:', error);
      throw error;
    }
  }

  async deleteCustomAgent(agentId: string): Promise<void> {
    await this.api.delete(`/ai-service/${this.tenant}/agentic/agents/${agentId}`);
  }

  async patchCustomAgent(agentId: string, patches: PatchOperation[]): Promise<void> {
    await this.api.patch(`/ai-service/${this.tenant}/agentic/agents/${agentId}`, patches);
  }

  async getCommerceEvents(): Promise<{ events: string[] }> {
    return await this.api.get<{ events: string[] }>(`/ai-service/${this.tenant}/agentic/commerce-events`);
  }
} 