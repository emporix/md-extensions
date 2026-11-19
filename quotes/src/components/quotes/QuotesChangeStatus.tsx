import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import {
  QuoteChangeStatusType,
  QuoteUpdateStatusValue,
} from '../../models/Quotes.model'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useQuotesApi } from '../../hooks/api/quotes'
import QuotesChangeStatusDetails from './QuotesChangeStatusDetails'
import { useQuoteData } from '../../context/Quote.provider'
import {
  buildQuoteChangeStatusPayload,
  QuoteChangeStatusFormData,
} from '../../helpers/quoteChangeStatus.helpers'
import { getApiErrorMessage } from '../../helpers/api'
import styles from './QuotesChangeStatus.module.scss'

interface QuotesChangeStatusProps {
  quoteId: string
  changeType: QuoteChangeStatusType
  close: () => void
  visible: boolean
}

/** Approve or decline dialog: the details form, then a yes / no confirm. */
const QuotesChangeStatus = (props: QuotesChangeStatusProps) => {
  const { quoteId, changeType, close, visible } = props
  const { refreshData } = useQuoteData()
  const { t } = useTranslation()
  const { setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const toast = useToast()
  const { changeQuoteStatus } = useQuotesApi()
  const [confirmStepVisible, setConfirmStepVisible] = useState<boolean>(false)
  const [formData, setFormData] = useState<Partial<QuoteUpdateStatusValue>>()

  const onAccept = async () => {
    if (changeType === QuoteChangeStatusType.change) {
      await approveQuote()
    } else if (changeType === QuoteChangeStatusType.decline) {
      await declineQuote()
    }
  }

  const approveQuote = async () => {
    if (!formData) return
    const payload = buildQuoteChangeStatusPayload(
      QuoteChangeStatusType.change,
      formData
    )
    try {
      blockPanel(true)
      await changeQuoteStatus(quoteId, payload)
      toast.showToast(t('quotes.toasts.successApprove'), '', 'success')
      setRefreshValue()
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

  const declineQuote = async () => {
    if (!formData) return
    const payload = buildQuoteChangeStatusPayload(
      QuoteChangeStatusType.decline,
      formData
    )
    try {
      blockPanel(true)
      await changeQuoteStatus(quoteId, payload)
      toast.showToast(t('quotes.toasts.successDecline'), '', 'success')
      setRefreshValue()
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

  const onFormSubmit = useCallback((formData: QuoteChangeStatusFormData) => {
    setFormData(formData)
    setConfirmStepVisible(true)
  }, [])

  const getTitle = useMemo(() => {
    if (changeType === QuoteChangeStatusType.change) {
      return t('quotes.dialog.status.titleUpdate')
    } else if (changeType === QuoteChangeStatusType.decline) {
      return t('quotes.dialog.status.titleDecline')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [changeType])

  return (
    <Dialog
      onHide={close}
      header={getTitle}
      visible={visible}
      // Prime's default in MD: a click on the mask does not close it.
      dismissableMask={false}
      data-testid="quote-change-status-dialog"
    >
      <div className={styles.wrapper}>
        {!confirmStepVisible ? (
          <QuotesChangeStatusDetails
            changeType={changeType}
            onSubmit={onFormSubmit}
            onCancel={close}
          ></QuotesChangeStatusDetails>
        ) : (
          <div>
            <p className={styles.message}>
              {t('quotes.dialog.status.msg', {
                quoteId,
                type: t(
                  `quotes.dialog.status.types.${changeType.toLowerCase()}`
                ),
              })}
            </p>
            <div className={styles.buttons}>
              <SecondaryButton onClick={close}>
                {t('global.no')}
              </SecondaryButton>
              <PrimaryButton onClick={onAccept}>
                {t('global.yes')}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default QuotesChangeStatus
