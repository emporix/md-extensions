import { AgentTemplate, CustomAgent } from '../types/Agent';
import { AppState } from '../types/common';

// Patch operation type
export interface PatchOperation {
  op: 'REPLACE' | 'ADD' | 'REMOVE';
  path: string;
  value?: any;
}

// API Error types
export class AgentServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AgentServiceError';
  }
}

// API Response types (for future use)
// interface ApiResponse<T> {
//   data?: T;
//   error?: string;
//   success: boolean;
// }

export class AgentService {
  private _baseUrl = import.meta.env.VITE_API_URL 

  constructor(private _appState: AppState) {} 

  async getAgentTemplates(): Promise<AgentTemplate[]> {
    try {
      const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/templates`, {
        headers: {
          'Authorization': `Bearer ${this._appState.token}`,
          'Content-Type': 'application/json',
          'Emporix-tenant': this._appState.tenant,
        },
      });
      
      if (!response.ok) {
        throw new AgentServiceError(`Failed to fetch agent templates: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof AgentServiceError) {
        throw error;
      }
      throw new AgentServiceError(`Network error while fetching agent templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomAgents(): Promise<CustomAgent[]> {
    try {
      const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/agents`, {
        headers: {
          'Authorization': `Bearer ${this._appState.token}`,
          'Content-Type': 'application/json',
          'Emporix-tenant': this._appState.tenant,
        },
      });
      
      if (!response.ok) {
        throw new AgentServiceError(`Failed to fetch custom agents: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof AgentServiceError) {
        throw error;
      }
      throw new AgentServiceError(`Network error while fetching custom agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async copyTemplate(templateId: string, id: string, name: string, description: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/templates/${templateId}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._appState.token}`,
        'Content-Type': 'application/json',
        'Emporix-tenant': this._appState.tenant,
      },
      body: JSON.stringify({
        id,
        "name" : {"en" : name},
        "description" : {"en" : description}
      })
    })
    if (!response.ok) throw new Error('Failed to clone agent template')
    return await response.json()
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
        ...(agent.llmConfig.token && { token: agent.llmConfig.token })
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
    }
    
    const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/agents/${agent.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this._appState.token}`,
        'Content-Type': 'application/json',
        'Emporix-tenant': this._appState.tenant,
      },
      body: JSON.stringify(formattedAgent)
    })
    if (!response.ok) throw new Error('Failed to upsert custom agent')
    
    const responseText = await response.text()
    if (!responseText) {
      return formattedAgent as CustomAgent
    }
    
    try {
      return JSON.parse(responseText)
    } catch (error) {
      return formattedAgent as CustomAgent
    }
  }

  async deleteCustomAgent(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this._appState.token}`,
          'Content-Type': 'application/json',
          'Emporix-tenant': this._appState.tenant,
        },
      });
      
      if (!response.ok) {
        throw new AgentServiceError(`Failed to delete custom agent: ${response.statusText}`, response.status);
      }
    } catch (error) {
      if (error instanceof AgentServiceError) {
        throw error;
      }
      throw new AgentServiceError(`Network error while deleting custom agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async patchCustomAgent(agentId: string, patches: PatchOperation[]): Promise<void> {
    try {
      const response = await fetch(`${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this._appState.token}`,
          'Content-Type': 'application/json',
          'Emporix-tenant': this._appState.tenant,
        },
        body: JSON.stringify(patches),
      });
      
      if (!response.ok) {
        throw new AgentServiceError(`Failed to patch custom agent: ${response.statusText}`, response.status);
      }
    } catch (error) {
      if (error instanceof AgentServiceError) {
        throw error;
      }
      throw new AgentServiceError(`Network error while patching custom agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

} 