import type { QuoteHistoryEntry } from '@emporix/api-calls/next'
import type Localized from '../models/Localized.model'
import { Quote, QuoteStatus, Status } from '../models/Quotes.model'

/** `created` is the quote request itself, which the history endpoint omits. */
export type QuoteHistoryRow = {
  readonly id: string
  readonly kind: 'created' | 'status'
  readonly date?: string
  readonly changedBy: string
  readonly status?: QuoteStatus
  readonly comment?: string
  readonly reason?: Localized
}

const STATUS_PATH = '/status'

const userName = (first?: string, last?: string) =>
  [first, last].filter(Boolean).join(' ')

/** The status changes of the history, newest first, as the storefront lists them. */
export const toQuoteStatusHistoryRows = (
  entries: readonly QuoteHistoryEntry[]
): QuoteHistoryRow[] =>
  entries
    .filter((entry) => entry.path === STATUS_PATH && !!entry.newValue)
    .map((entry, index): QuoteHistoryRow => {
      const status = entry.newValue as Status
      const name = userName(entry.userFirstName, entry.userLastName)
      return {
        id: entry.id ?? `status-${index}`,
        kind: 'status',
        date: entry.modifiedAt,
        changedBy: entry.userType ? `${name} (${entry.userType})`.trim() : name,
        status: status.value,
        comment: status.comment?.trim() || undefined,
        reason: status.quoteReason?.message,
      }
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

/** The first row of the history: who requested the quote and when. */
export const toQuoteCreatedRow = (
  quote: Pick<Quote, 'id' | 'customer' | 'metadata'>
): QuoteHistoryRow => ({
  id: `created-${quote.id}`,
  kind: 'created',
  date: quote.metadata?.createdAt,
  changedBy: userName(quote.customer?.firstName, quote.customer?.lastName),
})

/** Status rows newest first, the request at the bottom. */
export const buildQuoteHistoryRows = (
  quote: Pick<Quote, 'id' | 'customer' | 'metadata'>,
  entries: readonly QuoteHistoryEntry[]
): QuoteHistoryRow[] => [
  ...toQuoteStatusHistoryRows(entries),
  toQuoteCreatedRow(quote),
]
