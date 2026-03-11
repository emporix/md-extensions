import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastOrders } from '../../hooks/useLastOrders'
import {
  formatOrderDateForTimeline,
  getOrderCustomerDisplayName,
  formatOrderTotal,
} from '../../helpers/order.helpers'
import {
  TimelineWidget,
  type TimelineEntry,
} from '../../components/TimelineWidget'
import { ROUTES } from '../../data/routes'

const DISPLAY_COUNT = 10

export const LastOrdersTimelineWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { orders, loading, error } = useLastOrders(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const entries: TimelineEntry[] = useMemo(() => {
    const now = new Date()
    return orders.slice(0, DISPLAY_COUNT).map((order) => {
      const customerName = getOrderCustomerDisplayName(order)
      return {
        id: order.id,
        dateLabel: formatOrderDateForTimeline(order.created, now, t),
        href: ROUTES.order(order.id),
        displayId: order.id,
        customerName: customerName !== '—' ? customerName : null,
        meta: formatOrderTotal(order),
      }
    })
  }, [orders, t])

  return (
    <TimelineWidget
      title={t('lastOrdersTimeline.title')}
      loading={loading}
      error={error ? t(error) : null}
      entries={entries}
      emptyMessage={t('lastOrdersTimeline.noResults')}
      loadingMessage={t('lastOrdersTimeline.loading')}
      ariaLabel={t('lastOrdersTimeline.ariaLabel')}
    />
  )
}
