import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Dialog,
  PrimaryButton,
  SecondaryButton,
} from '@emporix/component-library'
import { useOrdersApi } from '../../hooks/api/orders'
import { useUIBlocker } from '../../context/UIBlocker'
import { mapToCsv, saveToCsvFile } from '../../helpers/download'
import { formatDate, formatDateWithTime } from '../../helpers/date'
import styles from './OrderCSVExportDialog.module.scss'

type OrderCSVExportDialogProps = {
  readonly visible: boolean
  readonly onReject: () => void
}

const OrderCSVExportDialog = ({
  visible,
  onReject,
}: OrderCSVExportDialogProps) => {
  const { t, i18n } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { syncOrdersToCsv } = useOrdersApi()
  const [fromDate, setFromDate] = useState<Date>(new Date())
  const [toDate, setToDate] = useState<Date>(new Date())

  const csvColumns = useMemo(
    () => [
      t('orders.csv.columns.orderNumber'),
      t('orders.csv.columns.creationDate'),
      t('orders.csv.columns.customer'),
      t('orders.csv.columns.companyName'),
      t('orders.csv.columns.customerType'),
      t('orders.csv.columns.deliveryPostCode'),
      t('orders.csv.columns.deliveryCity'),
      t('orders.csv.columns.customerNumber'),
      t('orders.csv.columns.status'),
      t('orders.csv.columns.invoiceNumber'),
      t('orders.csv.columns.paymentMethod'),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  )

  const getPaymentMethod = (payment: string | undefined) => {
    switch (payment) {
      case 'paymentByInvoice':
        return t('orders.csv.paymentMethod.invoice')
      case 'paymentByDebit':
        return t('orders.csv.paymentMethod.debit')
      case 'paymentByCash':
        return t('orders.csv.paymentMethod.cash')
      case 'paymentByCredit':
        return t('orders.csv.paymentMethod.credit')
      default:
        return ''
    }
  }

  const csvExportHandler = async () => {
    const deliveryDateRange = {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    }
    try {
      onReject()
      blockPanel(true)
      const data = await syncOrdersToCsv(deliveryDateRange)
      const csv = mapToCsv(csvColumns, data, (order) => {
        const generalAttributes = order.customer?.mixins?.generalAttributes
        const customerType =
          generalAttributes?.customerType === 'private'
            ? t('orders.csv.customerType.private')
            : t('orders.csv.customerType.company')
        return [
          order.id,
          formatDate(order.created),
          order.customer?.name ?? '',
          order.customer?.company ?? '',
          customerType,
          order.shippingAddress?.zipCode ?? '',
          order.shippingAddress?.city ?? '',
          generalAttributes?.customerNumber ?? '',
          order.status,
          order.mixins?.invoice?.invoiceNo ?? '',
          getPaymentMethod(order.mixins?.payment?.paymentType),
        ]
      })
      saveToCsvFile(`${formatDateWithTime(new Date())}.csv`, csv)
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
    }
  }

  return (
    <Dialog
      header={t('orders.csv.dialog.title')}
      visible={visible}
      onHide={onReject}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onReject}>
            {t('global.cancel')}
          </SecondaryButton>
          <PrimaryButton onClick={csvExportHandler}>
            {t('global.export.csv')}
          </PrimaryButton>
        </div>
      }
    >
      <div className={styles.fields}>
        <Calendar
          label={t('orders.csv.dialog.dateFrom')}
          value={fromDate}
          maxDate={toDate}
          dateFormat={t('global.dateFormat')}
          onChange={(e) => e.value instanceof Date && setFromDate(e.value)}
        />
        <Calendar
          label={t('orders.csv.dialog.dateTo')}
          value={toDate}
          minDate={fromDate}
          dateFormat={t('global.dateFormat')}
          onChange={(e) => e.value instanceof Date && setToDate(e.value)}
        />
      </div>
    </Dialog>
  )
}

export default OrderCSVExportDialog
