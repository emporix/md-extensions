/**
 * MD rendered payment/transaction states with PrimeReact `Badge` severities.
 * CL has no Prime-style Badge, so the severity maps to a `StatusBadge` colour
 * (agreed substitution, see CL_WIDGET_STATUS.md `primereact/badge`).
 */
export type PaymentSeverity = 'info' | 'danger' | 'success' | 'warning'

export const SEVERITY_COLOR: Record<PaymentSeverity, string> = {
  info: '#3B73BB',
  danger: '#E8615A',
  success: '#42a64e',
  warning: '#C98921',
}

const DANGER_STATUSES = [
  'AUTHORIZATION_FAILURE',
  'CAPTURE_FAILURE',
  'CANCELLATION_FAILURE',
  'FAILURE',
]
const SUCCESS_STATUSES = [
  'AUTHORIZATION_SUCCESS',
  'CAPTURE_SUCCESS',
  'SUCCESS',
  'CANCELLATION_SUCCESS',
]
const AUTHORIZATION_TYPES = [
  'AUTHORIZATION',
  'AUTHORIZATION_START',
  'AUTHORIZATION_CALLBACK',
]

export const paymentStatusSeverity = (status: string): PaymentSeverity => {
  if (status === 'PENDING') return 'info'
  if (DANGER_STATUSES.includes(status)) return 'danger'
  if (SUCCESS_STATUSES.includes(status)) return 'success'
  return 'warning'
}

export const transactionTypeSeverity = (type: string): PaymentSeverity => {
  if (AUTHORIZATION_TYPES.includes(type)) return 'info'
  if (type === 'CANCEL') return 'danger'
  if (type === 'CAPTURE') return 'success'
  return 'warning'
}
