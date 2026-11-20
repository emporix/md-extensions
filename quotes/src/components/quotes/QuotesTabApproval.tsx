import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuoteData } from '../../context/Quote.provider'
import { useQuotesApi } from '../../hooks/api/quotes'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import {
  QuoteChangeStatusType,
  QuoteUpdateStatusValue,
} from '../../models/Quotes.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { getQuoteApprovalActions } from '../../helpers/quoteStatus.helpers'
import {
  buildQuotePendingPayload,
  buildQuoteSendPayload,
} from '../../helpers/quoteChangeStatus.helpers'
import { getApiErrorMessage } from '../../helpers/api'
import { quotesListPath } from '../../constants/paths'
import QuotesChangeStatus from './QuotesChangeStatus'
import QuotesStartNegotiation from './QuotesStartNegotiation'
import styles from './QuotesTabApproval.module.scss'

/**
 * MD `QuotesTabApproval`: the quote PDF and, by status, "Create Quote"
 * (send) or Decline / Approve.
 */
const QuotesTabApproval = (props: StylableProps) => {
  const { className = '' } = props
  const { t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { getQuotePdf, changeQuoteStatus } = useQuotesApi()
  const { navigate } = useCustomNavigate()
  const { quote } = useQuoteData()
  const toast = useToast()
  const [quoteUpdateType, setQuoteUpdateType] =
    useState<QuoteChangeStatusType>()
  const [pdfData, setPdfData] = useState<string>()
  const [negotiationVisible, setNegotiationVisible] = useState(false)
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)

  useEffect(() => {
    if (!quote) return
    ;(async () => {
      await onInit()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quote])

  // Frees a PDF URL once a newer PDF replaces it and when the tab unmounts
  // (MD never revoked them, so each shown quote kept its PDF in memory).
  useEffect(() => {
    if (!pdfData) return
    return () => URL.revokeObjectURL(pdfData)
  }, [pdfData])

  const onInit = async () => {
    if (!quote) return
    blockPanel(true)
    try {
      const data = await getQuotePdf(quote.id)
      const file = new Blob([data], { type: 'application/pdf' })
      const fileURL = URL.createObjectURL(file)
      setPdfData(fileURL)
    } catch (e) {
      console.error(e)
      toast.showToast(t('quotes.toasts.errorPdf'), '', 'error')
    } finally {
      blockPanel(false)
    }
  }

  // Sends the quote shown now (MD kept the one of the first render, so Create
  // did nothing when the tab opened before the quote loaded).
  const sendQuote = useCallback(
    async (payload: QuoteUpdateStatusValue, successMessage: string) => {
      if (!quote) return
      try {
        blockPanel(true)
        await changeQuoteStatus(quote.id, payload)
        toast.showToast(successMessage, '', 'success')
        navigate(quotesListPath(), { replace: true })
      } catch (e) {
        console.error(e)
        toast.showToast(
          getApiErrorMessage(e) ?? t('quotes.toasts.errorChangeStatus'),
          '',
          'error'
        )
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the hooks' functions are stable
    [quote]
  )

  const onCreateSubmit = useCallback(
    () => sendQuote(buildQuoteSendPayload(), t('quotes.toasts.successCreate')),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` follows i18n.language
    [sendQuote]
  )

  // COP-7125: an incomplete quote (no prices or addresses yet) cannot be OPEN;
  // it is sent as pending (IN_PROGRESS) and completed later.
  const onPendingSubmit = useCallback(
    () =>
      sendQuote(buildQuotePendingPayload(), t('quotes.toasts.successPending')),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` follows i18n.language
    [sendQuote]
  )

  const quoteCanBeChange = useMemo(() => {
    return getQuoteApprovalActions(quote?.status.value) !== undefined
  }, [quote])

  const getButtons = useCallback(() => {
    const actions = getQuoteApprovalActions(quote?.status.value)
    if (actions === 'create') {
      return (
        <>
          <SecondaryButton disabled={!canManage} onClick={onPendingSubmit}>
            {t('quotes.tabs.approval.pendingBtn')}
          </SecondaryButton>
          <PrimaryButton disabled={!canManage} onClick={onCreateSubmit}>
            {t('quotes.tabs.approval.createBtn')}
          </PrimaryButton>
        </>
      )
    } else if (actions === 'negotiate') {
      // COP-7125: the employee opens a negotiation round (OPEN → IN_PROGRESS).
      return (
        <PrimaryButton
          disabled={!canManage}
          onClick={() => setNegotiationVisible(true)}
        >
          {t('quotes.tabs.approval.startNegotiationBtn')}
        </PrimaryButton>
      )
    } else if (actions === 'decide') {
      return (
        <>
          <SecondaryButton
            disabled={!canManage}
            onClick={() => setQuoteUpdateType(QuoteChangeStatusType.decline)}
          >
            {t('quotes.tabs.approval.declineBtn')}
          </SecondaryButton>
          <PrimaryButton
            disabled={!canManage}
            onClick={() => setQuoteUpdateType(QuoteChangeStatusType.change)}
          >
            {t('quotes.tabs.approval.approveBtn')}
          </PrimaryButton>
        </>
      )
    }
    // Permissions may arrive after the quote (a deep link); MD memoized on
    // the quote alone and kept the buttons disabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` follows i18n.language
  }, [quote, canManage, onCreateSubmit, onPendingSubmit])

  return (
    <div className={className}>
      {quoteCanBeChange && <div className={styles.buttons}>{getButtons()}</div>}
      <div className={styles.pdf}>
        <iframe
          src={pdfData}
          height="600px"
          width="900px"
          title={t('quotes.tabs.approval.title')}
        />
      </div>

      {quote && negotiationVisible && (
        <QuotesStartNegotiation
          visible={negotiationVisible}
          quoteId={quote.id}
          close={() => setNegotiationVisible(false)}
        />
      )}
      {quote && quoteUpdateType && (
        <QuotesChangeStatus
          visible={!!quoteUpdateType}
          changeType={quoteUpdateType}
          quoteId={quote.id}
          close={() => setQuoteUpdateType(undefined)}
        />
      )}
    </div>
  )
}

export default QuotesTabApproval
