import type { Payment } from '../../../models/Order.model'
import type { PaymentTransaction } from '../../../models/PaymentGateway.model'

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

/** Payment statuses an operator can still capture: authorized, or a capture that failed. */
const CAPTURABLE_STATUSES = ['AUTHORIZATION_SUCCESS', 'CAPTURE_FAILURE']

/**
 * The order's payment status follows the gateway asynchronously, so a successful CAPTURE in
 * the transaction log also counts: the gateway would answer a second capture with
 * "already found" and `successful: true` without capturing anything.
 */
export const isCapturable = (
  payment: Payment | null,
  transaction: PaymentTransaction | undefined
): boolean =>
  !!payment?.transactionId &&
  CAPTURABLE_STATUSES.includes(payment.status) &&
  !transaction?.entries?.some(
    (entry) => entry.type === 'CAPTURE' && entry.successful
  )

const toCents = (value: number) => Math.round(value * 100)

const successfulTotal = (
  transaction: PaymentTransaction | undefined,
  type: string
): number =>
  (transaction?.entries ?? [])
    .filter((entry) => entry.type === type && entry.successful)
    .reduce((sum, entry) => sum + toCents(entry.amount?.amount ?? 0), 0) / 100

/**
 * What was actually taken from the customer: the successful captures in the transaction log,
 * or the payment's paid amount while the log is not loaded or holds no capture amounts.
 */
export const capturedAmount = (
  payment: Payment | null,
  transaction: PaymentTransaction | undefined
): number => successfulTotal(transaction, 'CAPTURE') || payment?.paidAmount || 0

/**
 * What can still be refunded: the captured amount less every successful refund, so an
 * operator can refund in several steps up to what was captured. Failed refunds do not count.
 */
export const refundableAmount = (
  payment: Payment | null,
  transaction: PaymentTransaction | undefined
): number =>
  Math.max(
    0,
    (toCents(capturedAmount(payment, transaction)) -
      toCents(successfulTotal(transaction, 'REFUND'))) /
      100
  )
