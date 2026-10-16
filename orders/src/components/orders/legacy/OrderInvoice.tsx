import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getOrderInvoiceLink } from '@emporix/api-calls'
import { SectionBox } from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import type { Invoice } from '../../../models/Order.model'
import styles from './Legacy.module.scss'

const OrderInvoice = ({ invoice }: { readonly invoice: Invoice }) => {
  const { t } = useTranslation()
  const [invoiceUrl, setInvoiceUrl] = useState('')

  useEffect(() => {
    if (!invoice.invoiceDocument) return
    void (async () => {
      try {
        const orderInvoice = await getOrderInvoiceLink(
          invoice.invoiceDocument as string
        )
        setInvoiceUrl(orderInvoice.link)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [invoice.invoiceDocument])

  return (
    <div>
      {/* MD shows the "Customer" title here; kept for parity. */}
      <div className={styles.subtitle}>{t('orders.data.title.customer')}</div>
      <SectionBox>
        <LabeledValue
          className={styles.invoiceNo}
          label={t('orders.data.label.invoiceNo')}
        >
          {invoice.invoiceNo}
        </LabeledValue>
        <a href={invoiceUrl} target="_blank" rel="noreferrer">
          {t('orders.data.label.downloadInvoice')}
        </a>
      </SectionBox>
    </div>
  )
}

export default OrderInvoice
