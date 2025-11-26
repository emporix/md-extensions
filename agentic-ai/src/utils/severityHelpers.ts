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

export const getSeverityColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return '#ef4444' // Red
    case 'WARNING':
      return '#f59e0b' // Yellow/Orange
    case 'INFO':
    default:
      return '#3b82f6' // Blue
  }
}
