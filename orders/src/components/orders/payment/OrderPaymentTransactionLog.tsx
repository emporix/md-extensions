import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MoneyValue,
  SecondaryButton,
  SectionBox,
  StatusBadge,
} from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import DotIndicator from '../../shared/DotIndicator'
import type { PaymentTransactionEntry } from '../../../models/PaymentGateway.model'
import { SEVERITY_COLOR, transactionTypeSeverity } from './paymentStatus'
import styles from './Payment.module.scss'

const formatRawResponse = (raw: string) => {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const OrderPaymentTransactionLog = ({
  transactionEntry,
}: {
  readonly transactionEntry: PaymentTransactionEntry
}) => {
  const { t, i18n } = useTranslation()
  const [expand, setExpand] = useState(false)

  return (
    <SectionBox>
      <div className={styles.fieldsWrap}>
        <LabeledValue label={t('orders.data.label.paymentInfo.type')}>
          <StatusBadge
            status={transactionEntry.type}
            color={
              SEVERITY_COLOR[transactionTypeSeverity(transactionEntry.type)]
            }
          />
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.paymentInfo.status')}>
          {/* MD colours a successful entry with its red token; kept for parity. */}
          <DotIndicator value={transactionEntry.successful} color="#e8615a" />
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.paymentInfo.amount')}>
          {transactionEntry.amount && (
            <MoneyValue
              currency={transactionEntry.amount.currency}
              value={transactionEntry.amount.amount}
              locale={i18n.language}
            />
          )}
        </LabeledValue>
        <LabeledValue label={t('orders.data.label.paymentInfo.timestamp')}>
          {transactionEntry.createdDate}
        </LabeledValue>
      </div>
      <LabeledValue label={t('orders.data.label.paymentInfo.details')}>
        <div className={styles.details}>
          <div className={expand ? undefined : styles.collapsed}>
            <pre>{formatRawResponse(transactionEntry.remoteResponse)}</pre>
          </div>
          <SecondaryButton
            className={styles.toggle}
            onClick={() => setExpand((prev) => !prev)}
          >
            {expand
              ? t('orders.data.label.paymentInfo.showLess')
              : t('orders.data.label.paymentInfo.showMore')}
          </SecondaryButton>
        </div>
      </LabeledValue>
    </SectionBox>
  )
}

export default OrderPaymentTransactionLog
