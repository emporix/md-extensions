export const SEVERITY_TO_NUMBER_MAP: Record<string, string> = {
  INFO: '10',
  WARNING: '20',
  ERROR: '30',
}

export const SEVERITY_OPTIONS = [
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
]

export const JOB_TYPE_OPTIONS = [
  { label: 'IMPORT', value: 'IMPORT' },
  { label: 'EXPORT', value: 'EXPORT' },
  { label: 'AGENT CHAT', value: 'AGENT_CHAT' },
]

export const JOB_STATUS_OPTIONS = [
  { label: 'FINISHED', value: 'success' },
  { label: 'FAILURE', value: 'failure' },
  { label: 'IN PROGRESS', value: 'in_progress' },
]

export const getJobTypeDisplay = (type: string): string => {
  return type.toUpperCase().replace('_', ' ')
}

export const convertJobTypeToApi = (type: string): string => {
  switch (type) {
    case 'IMPORT':
      return 'import'
    case 'EXPORT':
      return 'export'
    case 'AGENT_CHAT':
      return 'agent_chat'
    default:
      return type.toLowerCase()
  }
}
