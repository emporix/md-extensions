import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  DataTable,
  PrimaryButton,
} from '@emporix/component-library'
import AddEntryDialog from './AddEntryDialog'
import OrderEntryExpansion from './OrderEntryExpansion'
import useEntriesColumns from '../../../hooks/orders/useEntriesColumns'
import { usePermissions } from '../../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../../configs/accessControls'
import { Entry, Order, OrderStatus } from '../../../models/Order.model'
import styles from './OrderEntriesList.module.scss'

type OrderEntriesListProps = {
  readonly order: Order
  readonly readonly?: boolean
  readonly withMixins?: boolean
}

const OrderEntriesList = ({
  order,
  readonly = false,
  withMixins = true,
}: OrderEntriesListProps) => {
  const { t } = useTranslation()
  const { columns } = useEntriesColumns(order, readonly, withMixins)
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const isCompleted = order.status === OrderStatus.COMPLETED

  const [showAddEntryDialog, setShowAddEntryDialog] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Entry[]>([])
  const [pendingCollapse, setPendingCollapse] = useState<{
    rows: Entry[]
    entryId: string
  } | null>(null)
  const dirtyEntryIds = useRef<Set<string>>(new Set())

  const handleEntryDirtyChange = useCallback(
    (entryId: string, isDirty: boolean) => {
      if (isDirty) dirtyEntryIds.current.add(entryId)
      else dirtyEntryIds.current.delete(entryId)
    },
    []
  )

  const handleRowToggle = useCallback(
    (rows: Entry[]) => {
      const nextIds = new Set(rows.map((row) => row.id))
      const collapsedId = expandedRows
        .map((row) => row.id)
        .find((id) => !nextIds.has(id))
      if (collapsedId && dirtyEntryIds.current.has(collapsedId)) {
        setPendingCollapse({ rows, entryId: collapsedId })
        return
      }
      setExpandedRows(rows)
    },
    [expandedRows]
  )

  const confirmCollapse = () => {
    if (!pendingCollapse) return
    dirtyEntryIds.current.delete(pendingCollapse.entryId)
    setExpandedRows(pendingCollapse.rows)
    setPendingCollapse(null)
  }

  return (
    <>
      {!isCompleted && (
        <AddEntryDialog
          onClose={() => setShowAddEntryDialog(false)}
          visible={showAddEntryDialog}
        />
      )}
      {withMixins && (
        <ConfirmBox
          visible={!!pendingCollapse}
          onAccept={confirmCollapse}
          onReject={() => setPendingCollapse(null)}
          title={t('orders.tables.entries.confirm.collapseUnsaved.title')}
          message={t('orders.tables.entries.confirm.collapseUnsaved.message')}
          acceptLabel={t('global.discard')}
          rejectLabel={t('global.cancel')}
        />
      )}
      <DataTable
        dataKey="id"
        value={order.entries ?? []}
        columns={columns}
        showFilter={false}
        paginator={false}
        emptyMessage={t('orders.tables.entries.emptyText')}
        {...(withMixins
          ? {
              expandedRows,
              onRowToggle: (rows: unknown) => handleRowToggle(rows as Entry[]),
              rowExpansionTemplate: (entry: Entry) => (
                <OrderEntryExpansion
                  entry={entry}
                  entries={order.entries ?? []}
                  order={order}
                  readonly={readonly}
                  onDirtyChange={handleEntryDirtyChange}
                />
              ),
            }
          : {})}
      />
      {!isCompleted && !readonly && (
        <PrimaryButton
          className={styles.addButton}
          disabled={!canManage}
          onClick={() => setShowAddEntryDialog(true)}
        >
          {t('orders.tables.entries.addEntry')}
        </PrimaryButton>
      )}
    </>
  )
}

export default OrderEntriesList
