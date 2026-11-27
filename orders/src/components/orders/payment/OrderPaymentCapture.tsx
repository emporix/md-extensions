import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  InputNumber,
  MoneyValue,
  PrimaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import { usePaymentGatewayApi } from '../../../hooks/api/paymentGateway'
import { getApiErrorMessage } from '../../../helpers/api'
import type { Payment } from '../../../models/Order.model'
import styles from './Payment.module.scss'

type OrderPaymentCaptureProps = {
  readonly payment: Payment
  readonly currency: string
  /** Upper limit when the payment carries no authorized amount. */
  readonly fallbackAmount: number
  readonly canManage: boolean
  readonly currencyPrefix: string
  readonly onCaptured: () => Promise<void>
}

const OrderPaymentCapture = ({
  payment,
  currency,
  fallbackAmount,
  canManage,
  currencyPrefix,
  onCaptured,
}: OrderPaymentCaptureProps) => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { captureTransaction } = usePaymentGatewayApi()
  const maxAmount = payment.authorizedAmount ?? fallbackAmount
  const [amount, setAmount] = useState<number | null>(maxAmount)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [capturing, setCapturing] = useState(false)

  const capture = async () => {
    if (amount == null) return
    setCapturing(true)
    try {
      const result = await captureTransaction(
        payment.transactionId,
        amount,
        currency
      )
      if (result.successful) {
        showSuccess(t('orders.data.label.paymentInfo.captureSent'))
        await onCaptured()
      } else {
        showError(
          t('orders.data.label.paymentInfo.captureError'),
          result.message
        )
      }
    } catch (e: unknown) {
      showError(
        t('orders.data.label.paymentInfo.captureError'),
        getApiErrorMessage(e)
      )
    } finally {
      setCapturing(false)
      setConfirmVisible(false)
    }
  }

  return (
    <SectionBox
      className={styles.section}
      name={t('orders.data.label.paymentInfo.capture')}
    >
      <div className={styles.refund}>
        <InputNumber
          className={styles.refundInput}
          readOnly={!canManage}
          locale={i18n.language}
          value={amount}
          allowEmpty={false}
          prefix={currencyPrefix}
          min={0}
          max={maxAmount}
          minFractionDigits={2}
          maxFractionDigits={2}
          onChange={(e) => setAmount(e.value)}
        />
        <PrimaryButton
          disabled={!amount || !canManage || capturing}
          onClick={() => setConfirmVisible(true)}
        >
          {t('orders.data.label.paymentInfo.capture')}
        </PrimaryButton>
      </div>
      <ConfirmBox
        visible={confirmVisible}
        loading={capturing}
        onAccept={capture}
        onReject={() => setConfirmVisible(false)}
        title={t('orders.data.label.paymentInfo.captureConfirmTitle')}
        message={
          <>
            {t('orders.data.label.paymentInfo.captureConfirmMessage')}{' '}
            <MoneyValue
              currency={currency}
              value={amount ?? 0}
              locale={i18n.language}
            />
            {amount != null && amount < maxAmount && (
              <p>{t('orders.data.label.paymentInfo.capturePartialNote')}</p>
            )}
          </>
        }
        acceptLabel={t('orders.data.label.paymentInfo.capture')}
        rejectLabel={t('orders.data.label.paymentInfo.cancel')}
      />
    </SectionBox>
  )
}

export default OrderPaymentCapture
