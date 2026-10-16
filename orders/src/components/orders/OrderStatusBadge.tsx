import { StatusBadge } from '@emporix/component-library'
import {
  BsBoxSeam,
  BsCart,
  BsCartCheck,
  BsCheckCircle,
  BsDot,
  BsXCircle,
} from 'react-icons/bs'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { textToTitleCase } from '../../helpers/utils'
import { Order, OrderStatus, OrderStatusColor } from '../../models/Order.model'
import styles from './OrderStatusBadge.module.scss'

type OrderStatusBadgeProps = {
  readonly order: Order
  readonly withExtendedStatus?: boolean
}

const statusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return <BsCheckCircle size="16" />
    case OrderStatus.CONFIRMED:
      return <BsCartCheck size="16" />
    case OrderStatus.CREATED:
      return <BsDot size="16" />
    case OrderStatus.DECLINED:
      return <BsXCircle size="16" />
    case OrderStatus.IN_CHECKOUT:
      return <BsCart size="16" />
    case OrderStatus.SHIPPED:
      return <BsBoxSeam size="16" />
    default:
      return null
  }
}

const ExtendedOrderStatus = ({ statusId }: { readonly statusId: string }) => {
  const { configuration } = useConfiguration()
  if (!configuration) return null
  const extended = configuration.extendedOrderStatuses?.find(
    (status) => status.id === statusId
  )
  return (
    <div className={styles.extended}>
      {extended ? textToTitleCase(extended.displayText) : '--'}
    </div>
  )
}

export const StatusIcon = statusIcon

const OrderStatusBadge = ({
  order,
  withExtendedStatus = false,
}: OrderStatusBadgeProps) => (
  <div className={styles.wrapper}>
    <StatusBadge
      status={order.status}
      color={OrderStatusColor[order.status]}
      icon={statusIcon(order.status)}
    />
    {withExtendedStatus && (
      <ExtendedOrderStatus
        statusId={order.mixins?.generalAttributes?.extendedOrderStatus ?? ''}
      />
    )}
  </div>
)

export default OrderStatusBadge
