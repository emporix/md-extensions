import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useOrdersInProgress } from '../../hooks/useOrdersInProgress'
import {
  getOrderCustomerDisplayName,
  formatOrderStatus,
  formatOrderTotal,
} from '../../helpers/order.helpers'
import { ROUTES } from '../../data/routes'
import styles from './OrdersInProgressWidget.module.scss'

const LIST_SIZE = 5

export const OrdersInProgressWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { orders, loading, error } = useOrdersInProgress(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const displayOrders = orders.slice(0, LIST_SIZE)
  const showList = !loading && !error

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('ordersInProgress.title')}</h3>
        <a href={ROUTES.orders} className={styles.seeAllLink}>
          {t('orders.seeAll')}
        </a>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <span>{t('ordersInProgress.loading')}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{t(error)}</span>
        </div>
      )}

      {showList && (
        <>
          <ul
            className={styles.list}
            aria-label={t('ordersInProgress.ariaLabel')}
          >
            {displayOrders.length === 0 ? (
              <li className={styles.listItem}>
                {t('ordersInProgress.noResults')}
              </li>
            ) : (
              displayOrders.map((order) => (
                <li key={order.id} className={styles.listItem}>
                  <div className={styles.itemMain}>
                    <a
                      href={ROUTES.order(order.id)}
                      className={`${styles.orderId} ${styles.orderLink}`}
                    >
                      {order.id}
                    </a>
                    <span className={styles.customerName}>
                      {getOrderCustomerDisplayName(order)}
                    </span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.status}>
                      {formatOrderStatus(order.status)}
                    </span>
                    <span className={styles.price}>
                      {formatOrderTotal(order)}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  )
}
