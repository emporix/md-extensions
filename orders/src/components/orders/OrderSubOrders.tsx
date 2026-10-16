import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  ProgressSpinner,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import { useOrdersApi } from '../../hooks/api/orders'
import useSubOrdersColumns from '../../hooks/orders/useSubOrdersColumns'
import useSubOrderEntriesColumns from '../../hooks/orders/useSubOrderEntriesColumns'
import { makeCall } from '../../helpers/api'
import type { Order } from '../../models/Order.model'
import styles from './OrderSubOrders.module.scss'

const ExpandedRowTemplate = ({ order }: { readonly order: Order }) => {
  const { t } = useTranslation()
  const { columns } = useSubOrderEntriesColumns(order)
  return (
    <div className={styles.expanded}>
      <DataTable
        value={order.entries ?? []}
        columns={columns}
        emptyMessage={t('orders.tables.entries.emptyText')}
        paginator={false}
        showFilter={false}
      />
    </div>
  )
}

type OrderSubOrdersProps = {
  readonly subOrderIds: string[]
}

const OrderSubOrders = ({ subOrderIds }: OrderSubOrdersProps) => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { syncOrdersNotSiteSpecific } = useOrdersApi()
  const { columns } = useSubOrdersColumns()
  const [suborders, setSuborders] = useState<Order[]>([])
  const [expandedRows, setExpandedRows] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const idsKey = subOrderIds.join(',')

  useEffect(() => {
    if (!subOrderIds.length) return
    void (async () => {
      try {
        const data = await makeCall(
          () =>
            syncOrdersNotSiteSpecific(
              { rows: 100, currentPage: 1 },
              { id: `(${idsKey})` }
            ),
          setIsLoading
        )
        setSuborders(data.values)
      } catch (e) {
        console.error(e)
        showError(t('orders.toasts.errorFetchSuborders'))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  if (isLoading) {
    return (
      <SectionBox sectionClassName={styles.loading}>
        <ProgressSpinner />
      </SectionBox>
    )
  }

  return (
    <DataTable
      dataKey="id"
      value={suborders}
      columns={columns}
      emptyMessage={t('orders.tables.suborders.emptyText')}
      rowExpansionTemplate={(rowData: Order) => (
        <ExpandedRowTemplate order={rowData} />
      )}
      expandedRows={expandedRows}
      onRowToggle={(rows) => setExpandedRows(rows as Order[])}
      showHeaders={false}
      paginator={false}
      showFilter={false}
    />
  )
}

export default OrderSubOrders
