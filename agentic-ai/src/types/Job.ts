export interface JobMetadata {
  version: number;
  createdAt: string;
  modifiedAt: string;
}

export interface Job {
  id: string;
  status: 'success' | 'failure' | 'in_progress';
  requestId: string;
  sessionId: string;
  agentType: string;
  agentId: string;
  commerceEvent: string;
  message: string;
  response?: string;
  metadata: JobMetadata;
}

export interface JobSummary {
  id: string;
  status: 'success' | 'failure' | 'in_progress';
  requestId: string;
  sessionId: string;
  agentType: string;
  agentId: string;
  commerceEvent: string;
  message: string;
  response?: string;
  createdAt: string;
}
