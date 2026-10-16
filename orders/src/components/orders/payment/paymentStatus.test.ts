import { describe, expect, it } from 'vitest'
import { paymentStatusSeverity, transactionTypeSeverity } from './paymentStatus'

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
