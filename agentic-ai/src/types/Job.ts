export interface JobMetadata {
  version: number
  createdAt: string
  modifiedAt: string
}

export interface ImportedItem {
  id: string
  name: string
  state: string
}

export interface ImportResultSummary {
  summary: {
    agents: ImportedItem[]
    tools: ImportedItem[]
    mcpServers: ImportedItem[]
  }
  message: string
}

export interface ExportResult {
  data: string // base64 encoded
  checksum: string
}

export interface Job {
  id: string
  status: 'success' | 'failure' | 'in_progress'
  requestId?: string
  sessionId?: string
  agentType?: string
  agentId: string
  message: string
  response?: string
  type?: 'import' | 'export' | 'agent_chat'
  importResult?: ImportResultSummary
  exportResult?: ExportResult
  metadata: JobMetadata
}

export interface JobSummary {
  id: string
  status: 'success' | 'failure' | 'in_progress'
  requestId?: string
  sessionId?: string
  agentType?: string
  agentId: string
  message: string
  response?: string
  type?: 'import' | 'export' | 'agent_chat'
  importResult?: ImportResultSummary
  exportResult?: ExportResult
  createdAt: string
}
