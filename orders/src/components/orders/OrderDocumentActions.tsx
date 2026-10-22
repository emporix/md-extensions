import { useTranslation } from 'react-i18next'
import { SecondaryButton, useToast } from '@emporix/component-library'
import { useOrdersApi } from '../../hooks/api/orders'
import { useInvoiceApi } from '../../hooks/api/invoice'
import { useUIBlocker } from '../../context/UIBlocker'
import { useFeatureToggles } from '../../context/FeatureTogglesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useOrderData } from '../../contexts/OrderData.provider'
import { extendedOrderStatusNumber } from '../../helpers/orders'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { Order, OrderStatus } from '../../models/Order.model'
import styles from './OrderDocumentActions.module.scss'

const PAYMENT_GATEWAY_FEATURE_TOGGLE_NAME = 'PAYMENT_GATEWAY'

/**
 * Delivery note / delivery confirmation / invoice actions (MD
 * `OrderDetailsActions` + legacy `OrderActions`, which were identical).
 */
const OrderDocumentActions = ({ order }: { readonly order: Order }) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const toggles = useFeatureToggles()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const { orderDeliveryNote, sendShippingConfirmation, sendInvoice } =
    useOrdersApi()
  const { sendInvoiceJob } = useInvoiceApi()
  const { refreshData } = useOrderData()
  const { blockPanel } = useUIBlocker()

  const run = async (toastKey: string, action: () => Promise<unknown>) => {
    try {
      blockPanel(true)
      await action()
      showSuccess(
        t(`orders.actions.toast.${toastKey}.title`),
        t(`orders.actions.toast.${toastKey}.message`)
      )
    } catch (err) {
      console.error(err)
      showError(
        t(`orders.actions.toast.${toastKey}.title`),
        t(`orders.actions.toast.${toastKey}.error`)
      )
    } finally {
      await refreshData()
      blockPanel(false)
    }
  }

  const printDeliveryNote = () =>
    run('deliveryNote', async () => {
      const data = await orderDeliveryNote(order)
      const url = window.URL.createObjectURL(
        new Blob([data as BlobPart], { type: 'application/pdf' })
      )
      window.open(url, '_blank')
    })

  const sendDeliveryConfirmation = () =>
    run('deliveryConfirmation', () => sendShippingConfirmation(order))

  const createInvoice = () =>
    toggles.isToggleValid(PAYMENT_GATEWAY_FEATURE_TOGGLE_NAME)
      ? run('invoiceJob', () => sendInvoiceJob(order.id))
      : run('invoice', () => sendInvoice(order))

  const blocked =
    !canManage ||
    order.status === OrderStatus.CREATED ||
    order.status === OrderStatus.DECLINED
  // NaN (no extended status) does not block, matching MD's parseInt check.
  const extendedStatus = extendedOrderStatusNumber(order)

  return (
    <div className={styles.actions}>
      <SecondaryButton disabled={blocked} onClick={printDeliveryNote}>
        {t('orders.actions.printDeliveryNote')}
      </SecondaryButton>
      <SecondaryButton
        disabled={blocked || extendedStatus < 60}
        onClick={sendDeliveryConfirmation}
      >
        {t('orders.actions.sendDeliveryConfirmation')}
      </SecondaryButton>
      <SecondaryButton
        disabled={blocked || extendedStatus < 70}
        onClick={createInvoice}
      >
        {t('orders.actions.createSendInvoice')}
      </SecondaryButton>
    </div>
  )
}

export default OrderDocumentActions
