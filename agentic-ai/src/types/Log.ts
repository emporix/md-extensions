export interface LogMessage {
  severity: 'INFO' | 'ERROR' | 'WARNING'
  message: string
  timestamp: string
  isBusinessLog?: boolean
  agentId: string
  requestId?: string
}

export interface Metadata {
  createdAt: string
  modifiedAt: string
  version: number
}

export interface LogSummary {
  id: string
  agentId: string
  requestId: string
  sessionId: string
  messageCount: number
  errorCount: number
  lastActivity: string
  severity: 'INFO' | 'ERROR' | 'WARNING'
  duration?: number
}
export interface RequestLogs {
  id: string
  sessionId: string
  requestId: string
  triggerAgentId: string
  severity: 'INFO' | 'ERROR' | 'WARNING'
  collaborationAgents: string[]
  messages: LogMessage[]
  metadata: Metadata
  duration?: number
}
export interface SessionLogs {
  sessionId: string
  triggerAgentId: string
  severity: string
  agents: string[]
  messages?: LogMessage[]
  metadata: Metadata
  duration?: number
}
