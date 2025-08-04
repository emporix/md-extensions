export interface AppState {
  tenant: string
  language: string
  token: string
}

export interface AgentCardBaseProps {
  onToggleActive: (agentId: string, enabled: boolean) => void | Promise<void>
}

export type AgentStatus = 'active' | 'inactive' 