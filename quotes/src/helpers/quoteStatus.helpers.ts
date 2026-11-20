import { QuoteStatus, Status } from '../models/Quotes.model'

const COMPLETED_STATUSES: readonly QuoteStatus[] = [
  QuoteStatus.ACCEPTED,
  QuoteStatus.DECLINED,
  QuoteStatus.DECLINED_BY_MERCHANT,
  QuoteStatus.EXPIRED,
]

/** A completed quote is read-only in every tab. */
export const isQuoteCompleted = (status: QuoteStatus | undefined): boolean =>
  status !== undefined && COMPLETED_STATUSES.includes(status)

/**
 * Whether the status box shows above the quote's tabs: always for a completed
 * quote (MD showed it on the General tab only), and for an open quote when its
 * status carries a reason or a message (COP-7116 QA).
 */
export const hasQuoteStatusDetails = (status: Status | undefined): boolean =>
  !!status &&
  (isQuoteCompleted(status.value) ||
    !!status.comment?.trim() ||
    !!status.quoteReason?.code)

/** The merchant still has to approve or decline the quote. */
export const isQuoteAwaitingDecision = (
  status: QuoteStatus | undefined
): boolean =>
  status === QuoteStatus.AWAITING || status === QuoteStatus.IN_PROGRESS

/** Approve and decline row actions of the quotes list. */
export const canChangeQuoteStatus = (
  status: QuoteStatus | undefined,
  canManage: boolean
): boolean => canManage && isQuoteAwaitingDecision(status)

export type QuoteApprovalActions = 'create' | 'decide'

/**
 * Buttons of the Approval tab: `create` sends a quote that is still being
 * created, `decide` offers decline and approve.
 */
export const getQuoteApprovalActions = (
  status: QuoteStatus | undefined
): QuoteApprovalActions | undefined => {
  if (status === QuoteStatus.CREATING) return 'create'
  if (isQuoteAwaitingDecision(status)) return 'decide'
  return undefined
}
