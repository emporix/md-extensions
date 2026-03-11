import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastOrders } from '../../hooks/useLastOrders'
import {
  getOrderCustomerDisplayName,
  formatOrderStatus,
  formatOrderDate,
  formatOrderTotal,
} from '../../helpers/order.helpers'
import type { SalesOrderApiResponse } from '../../api/orders.api'
import {
  DataTableWidget,
  type TableColumn,
} from '../../components/DataTableWidget'
import { dataTableStyles as styles } from '../../components/dataTableStyles'
import { ROUTES } from '../../data/routes'

const PAGE_SIZE = 10

export const LastOrdersTableWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { orders, loading, error } = useLastOrders(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const columns = useMemo(
    (): TableColumn<SalesOrderApiResponse>[] => [
      {
        key: 'order',
        header: t('table.order'),
        render: (order) => (
          <a href={ROUTES.order(order.id)} className={styles.idLink}>
            {order.id}
          </a>
        ),
      },
      {
        key: 'customer',
        header: t('table.customer'),
        render: (order) => getOrderCustomerDisplayName(order),
      },
      {
        key: 'status',
        header: t('table.status'),
        render: (order) => (
          <span className={styles.status}>
            {formatOrderStatus(order.status)}
          </span>
        ),
      },
      {
        key: 'total',
        header: t('table.total'),
        render: (order) => formatOrderTotal(order),
      },
      {
        key: 'date',
        header: t('table.date'),
        render: (order) => formatOrderDate(order.created),
      },
    ],
    [t]
  )

  return (
    <DataTableWidget
      title={t('orders.title')}
      seeAllHref={ROUTES.orders}
      seeAllLabel={t('orders.seeAll')}
      caption={t('orders.caption')}
      loading={loading}
      error={error ? t(error) : null}
      items={orders.slice(0, PAGE_SIZE)}
      columns={columns}
      getRowKey={(order) => order.id}
      emptyMessage={t('orders.noResults')}
      loadingMessage={t('orders.loading')}
    />
  )
}
