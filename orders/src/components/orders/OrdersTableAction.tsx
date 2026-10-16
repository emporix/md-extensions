import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { BsArrowClockwise, BsFillFilePdfFill } from 'react-icons/bs'
import TableActions from '../shared/TableActions'
import ChangeStatusDialog from './ChangeStatusDialog'
import { useOrdersApi } from '../../hooks/api/orders'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useUIBlocker } from '../../context/UIBlocker'
import { getApiErrorDetails, getApiErrorMessage } from '../../helpers/api'
import { orderDetailPath } from '../../constants/paths'
import type { Order, OrderStatus } from '../../models/Order.model'
import styles from './OrdersTableAction.module.scss'

type OrdersTableActionProps = {
  readonly order: Order
  readonly onUpdate: () => void
  readonly onDelete: (orderId: string) => Promise<unknown>
  readonly managerPermission?: boolean
}

const OrdersTableAction = ({
  order,
  onUpdate,
  onDelete,
  managerPermission = true,
}: OrdersTableActionProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { getOrderInvoiceLink, changeOrderStatus } = useOrdersApi()
  const { navigate } = useCustomNavigate()
  const { blockPanel } = useUIBlocker()
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const invoiceDocument = order.mixins?.invoice?.invoiceDocument

  useEffect(() => {
    if (!invoiceDocument) return
    void (async () => {
      try {
        const orderInvoice = await getOrderInvoiceLink(invoiceDocument)
        setInvoiceUrl(orderInvoice.link)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [invoiceDocument, getOrderInvoiceLink])

  const deleteOrderHandler = async () => {
    try {
      blockPanel(true)
      await onDelete(order.id)
      showSuccess(
        t('orders.actions.delete.success.title'),
        t('orders.actions.delete.success.message', { id: order.id })
      )
    } catch (e: unknown) {
      showError(
        t('orders.actions.delete.error.title'),
        getApiErrorDetails(e) ?? getApiErrorMessage(e)
      )
    } finally {
      blockPanel(false)
    }
  }

  const onChangeStatus = async (orderId: string, status?: OrderStatus) => {
    if (!status) return
    try {
      setIsProcessing(true)
      await changeOrderStatus(orderId, status)
      setShowStatusDialog(false)
      onUpdate()
    } catch (e: unknown) {
      showError(
        t('orders.toasts.errorUpdate'),
        getApiErrorDetails(e) ?? getApiErrorMessage(e)
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
      <TableActions
        managerPermission={managerPermission}
        onEdit={() => navigate(orderDetailPath(order.id))}
        onDelete={deleteOrderHandler}
        deleteConfirm={{ pluralsPath: 'orders', entity: order }}
        actions={[
          {
            icon: <BsFillFilePdfFill size={16} />,
            link: invoiceUrl,
            disabled: invoiceUrl.length === 0 || !managerPermission,
            tooltip: t('orders.actions.invoice'),
          },
          {
            icon: <BsArrowClockwise size={16} />,
            onClick: () => setShowStatusDialog(true),
            tooltip: t('orders.actions.changeStatus.name'),
            disabled: !managerPermission,
          },
        ]}
      />
      <ChangeStatusDialog
        orderId={order.id}
        visible={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onSubmit={onChangeStatus}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default OrdersTableAction
