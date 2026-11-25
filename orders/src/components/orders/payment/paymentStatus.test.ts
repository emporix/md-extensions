import { describe, expect, it } from 'vitest'
import {
  capturedAmount,
  paymentStatusSeverity,
  refundableAmount,
  transactionTypeSeverity,
} from './paymentStatus'
import type { Payment } from '../../../models/Order.model'
import type { PaymentTransactionEntry } from '../../../models/PaymentGateway.model'

describe('payment severities', () => {
  it('maps payment statuses like MD', () => {
    expect(paymentStatusSeverity('PENDING')).toBe('info')
    expect(paymentStatusSeverity('CAPTURE_FAILURE')).toBe('danger')
    expect(paymentStatusSeverity('CAPTURE_SUCCESS')).toBe('success')
    expect(paymentStatusSeverity('OTHER')).toBe('warning')
  })

  it('maps transaction types like MD', () => {
    expect(transactionTypeSeverity('AUTHORIZATION_START')).toBe('info')
    expect(transactionTypeSeverity('CANCEL')).toBe('danger')
    expect(transactionTypeSeverity('CAPTURE')).toBe('success')
    expect(transactionTypeSeverity('REFUND')).toBe('warning')
  })
})

const payment = (paidAmount?: number): Payment => ({
  status: 'CAPTURE_SUCCESS',
  method: 'mollie.creditcard',
  transactionId: 'tx-1',
  paidAmount,
})

const entry = (
  type: string,
  amount: number,
  successful = true
): PaymentTransactionEntry => ({
  type,
  successful,
  remoteResponse: '{}',
  amount: { amount, currency: 'EUR' },
})

describe('refundable amount', () => {
  it('starts from the captured amount, not the order total', () => {
    const transaction = { entries: [entry('CAPTURE', 464.1)] }

    expect(capturedAmount(payment(), transaction)).toBe(464.1)
    expect(refundableAmount(payment(), transaction)).toBe(464.1)
  })

  it('falls back to the paid amount while the log has no capture', () => {
    expect(refundableAmount(payment(464.1), undefined)).toBe(464.1)
  })

  it('subtracts every successful refund and ignores failed ones', () => {
    const transaction = {
      entries: [
        entry('CAPTURE', 464.1),
        entry('REFUND', 100),
        entry('REFUND', 0.3),
        entry('REFUND', 50, false),
      ],
    }

    expect(refundableAmount(payment(464.1), transaction)).toBe(363.8)
  })

  it('ignores failed captures and never goes below zero', () => {
    const transaction = {
      entries: [
        entry('CAPTURE', 200, false),
        entry('CAPTURE', 100),
        entry('REFUND', 100),
      ],
    }

    expect(capturedAmount(payment(), transaction)).toBe(100)
    expect(refundableAmount(payment(), transaction)).toBe(0)
  })
})
