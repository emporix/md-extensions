/**
 * Constants for log severity and status mappings
 */

// Severity enum to number mapping for API
export const SEVERITY_TO_NUMBER_MAP: Record<string, string> = {
  INFO: '10',
  WARNING: '20',
  ERROR: '30',
}

// Severity options for dropdown filters
export const SEVERITY_OPTIONS = [
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
]

// Job type options for dropdown filters
export const JOB_TYPE_OPTIONS = [
  { label: 'IMPORT', value: 'IMPORT' },
  { label: 'EXPORT', value: 'EXPORT' },
  { label: 'AGENT CHAT', value: 'AGENT_CHAT' },
]

// Job status options for dropdown filters
export const JOB_STATUS_OPTIONS = [
  { label: 'FINISHED', value: 'success' },
  { label: 'FAILURE', value: 'failure' },
  { label: 'IN PROGRESS', value: 'in_progress' },
]

/**
 * Get display value for job type
 */
export const getJobTypeDisplay = (type: string): string => {
  switch (type) {
    case 'import':
      return 'IMPORT'
    case 'export':
      return 'EXPORT'
    case 'agent_chat':
      return 'AGENT CHAT'
    default:
      return type.toUpperCase()
  }
}

/**
 * Convert job type from UI format to API format
 */
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
