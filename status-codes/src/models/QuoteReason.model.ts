import type { getQuoteReasonByIdCall } from '@emporix/api-calls'
import type Localized from './Localized.model'

/**
 * A status code is a quote reason of the Quote Service. The type comes from
 * the api-calls signature, which exports the call but not its model or the
 * `QuoteChangeStatusType` enum.
 */
export type QuoteReason = Awaited<ReturnType<typeof getQuoteReasonByIdCall>>

export type QuoteReasonType = QuoteReason['type']

export type QuoteReasonPayload = Omit<QuoteReason, 'id'>

// Same values as api-calls `QuoteChangeStatusType`, in MD's option order.
export const QUOTE_REASON_TYPES = ['CHANGE', 'DECLINE'] as QuoteReasonType[]

export type QuoteReasonFormFields = {
  type: QuoteReasonType
  code: string
  message: Localized | undefined
}

export const createQuoteReasonForm = (
  reason?: QuoteReason
): QuoteReasonFormFields => ({
  type: reason?.type ?? QUOTE_REASON_TYPES[0],
  code: reason?.code ?? '',
  message: reason?.message,
})

/** Every language value is blank (MD required a comment). */
export const isMessageEmpty = (message: Localized | undefined): boolean =>
  !message || Object.values(message).every((value) => !value?.trim())

/**
 * Body for create and update. An update carries the loaded
 * `metadata.version` so the service can reject a stale write.
 */
export const toQuoteReasonPayload = (
  form: QuoteReasonFormFields,
  loaded?: QuoteReason
): QuoteReasonPayload => ({
  type: form.type,
  code: form.code,
  message: form.message ?? {},
  ...(loaded ? { metadata: { version: loaded.metadata?.version } } : {}),
})
