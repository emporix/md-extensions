import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InputNumber,
  MoneyValue,
  PrimaryButton,
  SectionBox,
  StatusBadge,
  useToast,
} from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import EmptyContent from '../../shared/EmptyContent'
import OrderPaymentTransactionLog from './OrderPaymentTransactionLog'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { usePermissions } from '../../../context/PermissionsProvider'
import { usePaymentGatewayApi } from '../../../hooks/api/paymentGateway'
import { getApiErrorMessage } from '../../../helpers/api'
import { EmployeeDomains, VendorDomains } from '../../../configs/accessControls'
import type { PaymentTransaction } from '../../../models/PaymentGateway.model'
import { paymentStatusSeverity, SEVERITY_COLOR } from './paymentStatus'
import styles from './Payment.module.scss'

/** Currency symbol for the refund prefix (MD used `currency-symbol-map`). */
const currencySymbol = (currency: string, locale: string) => {
  try {
    return (
      new Intl.NumberFormat(locale, { style: 'currency', currency })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? currency
    )
  } catch {
    return currency
  }
}

const OrderPaymentInfo = () => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { order } = useOrderData()
  const { fetchTransaction, refundTransaction } = usePaymentGatewayApi()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const payment = useMemo(() => order?.payments?.[0] ?? null, [order])
  const [transaction, setTransaction] = useState<PaymentTransaction>()
  const [refund, setRefund] = useState<number | null>(0)

  const getTransaction = useCallback(async () => {
    if (!payment?.transactionId) return
    try {
      setTransaction(await fetchTransaction(payment.transactionId))
    } catch (e) {
      console.error(e)
    }
  }, [payment?.transactionId, fetchTransaction])

  useEffect(() => {
    void getTransaction()
  }, [getTransaction])

  if (!order) return null

  const maxRefundValue = () => {
    const refunded =
      transaction?.entries
        ?.filter((entry) => entry.type === 'REFUND')
        .reduce((sum, entry) => sum + (entry.amount?.amount || 0), 0) || 0
    return order.totalPrice - refunded
  }

  const handleRefundSubmit = async () => {
    if (refund == null || payment == null) return
    try {
      await refundTransaction(payment.transactionId, refund, order.currency)
      showSuccess(t('orders.data.label.paymentInfo.refundEvenSent'))
      await getTransaction()
    } catch (e: unknown) {
      showError(
        t('orders.data.label.paymentInfo.refundEventError'),
        getApiErrorMessage(e)
      )
    }
  }

  const money = (value: number | undefined, currency: string | undefined) =>
    currency && value !== undefined ? (
      <MoneyValue currency={currency} value={value} locale={i18n.language} />
    ) : (
      '-'
    )

  return (
    <div>
      <SectionBox
        className={styles.section}
        name={t('orders.data.label.paymentInfo.info')}
      >
        <div className={styles.fieldsWrap}>
          <LabeledValue label={t('orders.data.label.paymentInfo.provider')}>
            {payment?.provider || '-'}
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.paymentInfo.method')}>
            {payment?.method || '-'}
          </LabeledValue>
          <LabeledValue
            label={t('orders.data.label.paymentInfo.transactionId')}
          >
            {payment?.transactionId || '-'}
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.paymentInfo.status')}>
            {payment?.status ? (
              <StatusBadge
                status={payment.status}
                color={SEVERITY_COLOR[paymentStatusSeverity(payment.status)]}
              />
            ) : (
              '-'
            )}
          </LabeledValue>
          <LabeledValue
            label={t('orders.data.label.paymentInfo.authorizedAmount')}
          >
            {money(payment?.authorizedAmount, payment?.currency)}
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.paymentInfo.paidAmount')}>
            {money(payment?.paidAmount, payment?.currency)}
          </LabeledValue>
          <LabeledValue
            label={t('orders.data.label.paymentInfo.providerMessage')}
          >
            {payment?.paymentResponse || '-'}
          </LabeledValue>
        </div>
      </SectionBox>

      {payment?.status === 'CAPTURE_SUCCESS' && (
        <SectionBox
          className={styles.section}
          name={t('orders.data.label.paymentInfo.refund')}
        >
          <div className={styles.refund}>
            <InputNumber
              className={styles.refundInput}
              readOnly={!canManage}
              locale={i18n.language}
              value={refund}
              allowEmpty={false}
              prefix={`${currencySymbol(order.currency, i18n.language)} `}
              min={0}
              max={maxRefundValue()}
              minFractionDigits={2}
              maxFractionDigits={2}
              onChange={(e) => setRefund(e.value)}
            />
            <PrimaryButton
              disabled={!refund || !canManage}
              onClick={handleRefundSubmit}
            >
              {t('orders.data.label.paymentInfo.refund')}
            </PrimaryButton>
          </div>
        </SectionBox>
      )}

      <SectionBox name={t('orders.data.label.paymentInfo.transactionsLog')}>
        <div className={styles.log}>
          {transaction ? (
            transaction.entries?.map((entry) => (
              <OrderPaymentTransactionLog
                key={entry.id}
                transactionEntry={entry}
              />
            ))
          ) : (
            <EmptyContent
              text={t('orders.data.label.paymentInfo.noTransactionsLog')}
            />
          )}
        </div>
      </SectionBox>
    </div>
  )
}

export default OrderPaymentInfo
