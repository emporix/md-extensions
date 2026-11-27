import {
  QuoteChangeStatusType,
  QuoteReason,
  QuoteStatus,
  QuoteUpdateStatusValue,
} from '../models/Quotes.model'
import { getObjectWithNoEmptyValues } from './utils'

export type QuoteChangeStatusFormData = Pick<
  QuoteUpdateStatusValue,
  'quoteReasonId' | 'comment'
>

export interface QuoteChangeStatusDetails {
  readonly reason?: QuoteReason
  readonly comment?: string
}

/** Only reasons of the dialog's type are offered (the UI asks for DECLINE). */
export const filterQuoteReasonsByType = (
  reasons: readonly QuoteReason[],
  type: QuoteChangeStatusType
): QuoteReason[] => reasons.filter((reason) => reason.type === type)

/** Form values of the change-status dialog without empty fields. */
export const toQuoteChangeStatusFormData = ({
  reason,
  comment,
}: QuoteChangeStatusDetails): QuoteChangeStatusFormData =>
  getObjectWithNoEmptyValues({ quoteReasonId: reason?.id, comment })

/** Approving sends the quote to the customer; declining ends it. */
export const getQuoteChangeStatusTarget = (
  type: QuoteChangeStatusType
): QuoteStatus =>
  type === QuoteChangeStatusType.change
    ? QuoteStatus.OPEN
    : QuoteStatus.DECLINED_BY_MERCHANT

export const buildQuoteChangeStatusPayload = (
  type: QuoteChangeStatusType,
  formData: Partial<QuoteUpdateStatusValue>
): QuoteUpdateStatusValue => ({
  value: getQuoteChangeStatusTarget(type),
  ...formData,
})

/** "Create" on the Approval tab sends a quote that is still being created. */
export const buildQuoteSendPayload = (): QuoteUpdateStatusValue => ({
  value: QuoteStatus.OPEN,
})

/** "Send as Pending Quote" on the Approval tab sends an incomplete quote as IN_PROGRESS (shown as Pending). */
export const buildQuotePendingPayload = (): QuoteUpdateStatusValue => ({
  value: QuoteStatus.IN_PROGRESS,
})
