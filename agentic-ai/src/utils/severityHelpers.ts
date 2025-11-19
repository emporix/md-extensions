type SeverityType = 'success' | 'info' | 'warning' | 'danger'

/**
 * Get PrimeReact severity type for log level
 * @param level - Log level (INFO, ERROR, WARN, DEBUG)
 * @returns PrimeReact severity type
 */
export const getLogLevelSeverity = (level: string): SeverityType => {
  switch (level) {
    case 'ERROR':
      return 'danger'
    case 'WARNING':
    case 'WARN':
      return 'warning'
    case 'INFO':
    default:
      return 'info'
  }
}

/**
 * Get PrimeReact severity type for job/task status
 * @param status - Status (success, failure, in_progress)
 * @returns PrimeReact severity type
 */
export const getStatusSeverity = (status: string): SeverityType => {
  switch (status) {
    case 'success':
      return 'info' // Blue for finished
    case 'failure':
      return 'danger' // Red for failure
    case 'in_progress':
      return 'warning' // Yellow for in progress
    case 'error':
      return 'danger'
    case 'warning':
    case 'warn':
      return 'warning'
    default:
      return 'info'
  }
}

/**
 * Get display value for status
 * @param status - Status string
 * @returns User-friendly display value
 */
export const getStatusDisplayValue = (status: string): string => {
  switch (status) {
    case 'success':
      return 'FINISHED'
    case 'failure':
      return 'FAILURE'
    case 'in_progress':
      return 'IN PROGRESS'
    default:
      return status.toUpperCase()
  }
}

/**
 * Get icon class for status
 * @param status - Status string
 * @returns PrimeReact icon class
 */
export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'success':
      return 'pi pi-check-circle'
    case 'failure':
      return 'pi pi-times-circle'
    case 'in_progress':
      return 'pi pi-spin pi-spinner'
    default:
      return 'pi pi-info-circle'
  }
}

/**
 * Get color for status
 * @param status - Status string
 * @returns Hex color code
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return '#3b82f6' // Blue
    case 'failure':
      return '#ef4444' // Red
    case 'in_progress':
      return '#f59e0b' // Yellow
    default:
      return '#6b7280' // Gray
  }
}

/**
 * Get color for severity level (for border and text styling)
 * @param level - Severity level (INFO, WARNING, ERROR)
 * @returns Hex color code
 */
export const getSeverityColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return '#ef4444' // Red
    case 'WARNING':
    case 'WARN':
      return '#f59e0b' // Yellow/Orange
    case 'INFO':
    default:
      return '#3b82f6' // Blue
  }
}
