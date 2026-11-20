import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  Dropdown,
  InputText,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import InputField from '../shared/InputField'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useUIBlocker } from '../../context/UIBlocker'
import { useQuoteData } from '../../context/Quote.provider'
import { QuoteChangeStatusType, QuoteReason } from '../../models/Quotes.model'
import { filterQuoteReasonsByType } from '../../helpers/quoteChangeStatus.helpers'
import { buildStartNegotiationPayload } from '../../helpers/quotePricing.helpers'
import { getApiErrorMessage } from '../../helpers/api'
import styles from './QuotesChangeStatus.module.scss'

interface QuotesStartNegotiationProps {
  readonly quoteId: string
  readonly visible: boolean
  readonly close: () => void
}

/**
 * "Start negotiation" on an OPEN quote: an optional CHANGE reason and an
 * optional comment, then `REPLACE /status` to IN_PROGRESS and a reload, so the
 * header shows the new status (COP-7125, MD `QuotesStartNegotiation` of
 * emporix/management-dashboard#1707).
 */
const QuotesStartNegotiation = ({
  quoteId,
  visible,
  close,
}: QuotesStartNegotiationProps) => {
  const { t } = useTranslation()
  const toast = useToast()
  const { blockPanel } = useUIBlocker()
  const { refreshData } = useQuoteData()
  const { getQuotesReasons, changeQuoteStatus } = useQuotesApi()
  const [reasons, setReasons] = useState<QuoteReason[]>([])
  const [reasonId, setReasonId] = useState<string>()
  const [comment, setComment] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await getQuotesReasons()
        setReasons(
          filterQuoteReasonsByType(
            data as unknown as QuoteReason[],
            QuoteChangeStatusType.change
          )
        )
      } catch (e: unknown) {
        console.error(e)
        toast.showToast(
          getApiErrorMessage(e) ?? t('quotes.toasts.errorFetchReasons'),
          '',
          'error'
        )
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: once
  }, [])

  const reasonOptions = useMemo(
    () => reasons.map((reason) => ({ label: reason.code, value: reason.id })),
    [reasons]
  )

  const onSubmit = async () => {
    try {
      blockPanel(true)
      await changeQuoteStatus(
        quoteId,
        buildStartNegotiationPayload(reasonId, comment)
      )
      toast.showToast(t('quotes.toasts.successNegotiation'), '', 'success')
      refreshData()
    } catch (e: unknown) {
      console.error(e)
      toast.showToast(
        getApiErrorMessage(e) ?? t('quotes.toasts.errorChangeStatus'),
        '',
        'error'
      )
    } finally {
      blockPanel(false)
      close()
    }
  }

  return (
    <Dialog
      onHide={close}
      visible={visible}
      header={t('quotes.dialog.negotiation.title')}
      dismissableMask={false}
      data-testid="quote-negotiation-dialog"
    >
      <div className={styles.wrapper}>
        <InputField
          label={t('quotes.dialog.negotiation.reason')}
          className={styles.reasonField}
        >
          <Dropdown
            placeholder=""
            showClear
            options={reasonOptions}
            value={reasonId ?? null}
            onChange={(e) => setReasonId((e.value as string) ?? undefined)}
            data-testid="quote-negotiation-reason"
          />
        </InputField>
        <InputField
          label={t('quotes.dialog.negotiation.comment')}
          className={styles.commentField}
        >
          <InputText
            textarea
            rows={6}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-testid="quote-negotiation-comment"
          />
        </InputField>
        <div className={styles.buttons}>
          <SecondaryButton onClick={close}>
            {t('global.discard')}
          </SecondaryButton>
          <PrimaryButton onClick={onSubmit}>
            {t('quotes.dialog.negotiation.submit')}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  )
}

export default QuotesStartNegotiation
