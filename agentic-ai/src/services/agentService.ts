import { AgentTemplate, CustomAgent } from '../types/Agent';
import { AppState, ImportSummaryState } from '../types/common';
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

  async copyTemplate(templateId: string, id: string, name: string, description: string, userPrompt: string): Promise<{ success: boolean }> {
    return await this.api.post<{ success: boolean }>(
      `/ai-service/${this.tenant}/agentic/templates/${templateId}/agents`,
      {
        id,
        name: { en: name },
        description: { en: description },
        userPrompt: userPrompt
      }
    );
  }

  async upsertCustomAgent(agent: CustomAgent): Promise<CustomAgent> {
    const formattedAgent = {
      id: agent.id,
      name: typeof agent.name === 'string' ? { en: agent.name } : agent.name,
      description: typeof agent.description === 'string' ? { en: agent.description } : agent.description,
      userPrompt: agent.userPrompt,
      triggers: agent.triggers,
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
      tags: agent.tags || [],
      requiredScopes: agent.requiredScopes || []
    };
    
    return await this.api.put<CustomAgent>(
      `/ai-service/${this.tenant}/agentic/agents/${agent.id}`,
      formattedAgent
    );
  }

  async deleteCustomAgent(agentId: string, force?: boolean): Promise<void> {
    const url = `/ai-service/${this.tenant}/agentic/agents/${agentId}${force ? '?force=true' : ''}`;
    await this.api.delete(url);
  }

  async patchCustomAgent(agentId: string, patches: PatchOperation[]): Promise<void> {
    await this.api.patch(`/ai-service/${this.tenant}/agentic/agents/${agentId}`, patches);
  }

  async getCommerceEvents(): Promise<{ events: string[] }> {
    return await this.api.get<{ events: string[] }>(`/ai-service/${this.tenant}/agentic/commerce-events`);
  }

  async exportAgents(agentIds: string[]): Promise<{ exportedAt: string; data: string; checksum: string }> {
    return await this.api.post<{ exportedAt: string; data: string; checksum: string }>(
      `/ai-service/${this.tenant}/agentic/agents/export`,
      { agentIds }
    );
  }

  async importAgents(jsonBody: unknown): Promise<{
    importedAt: string;
    summary: {
      agents: Array<{ id: string; name: string; state: ImportSummaryState }>;
      tools: Array<{ id: string; name: string; state: ImportSummaryState }>;
      mcpServers: Array<{ id: string; name: string; state: ImportSummaryState }>;
    };
    message: string;
  }> {
    return await this.api.post<{
      importedAt: string;
      summary: {
        agents: Array<{ id: string; name: string; state: ImportSummaryState }>;
        tools: Array<{ id: string; name: string; state: ImportSummaryState }>;
        mcpServers: Array<{ id: string; name: string; state: ImportSummaryState }>;
      };
      message: string;
    }>(
      `/ai-service/${this.tenant}/agentic/agents/import`,
      jsonBody
    );
  }
} 