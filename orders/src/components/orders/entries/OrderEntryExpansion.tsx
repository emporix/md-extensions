import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner, useToast } from '@emporix/component-library'
import EmptyContent from '../../shared/EmptyContent'
import useMixinsForm from '../../mixins/useMixinsForm'
import { useUIBlocker } from '../../../context/UIBlocker'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { useOrdersApi } from '../../../hooks/api/orders'
import { getApiErrorMessage } from '../../../helpers/api'
import type { Metadata } from '../../../models/Metadata.model'
import type { Mixins } from '../../../models/Mixins.model'
import type { Entry, Order } from '../../../models/Order.model'
import { SchemaType } from '../../../models/Schema.model'
import styles from './OrderEntryExpansion.module.scss'

type OrderEntryExpansionProps = {
  readonly entry: Entry
  readonly entries: Entry[]
  readonly order: Order
  readonly readonly?: boolean
  readonly onDirtyChange?: (entryId: string, isDirty: boolean) => void
}

/**
 * Order-entry mixins (`SchemaType.ORDER_ENTRY`) shown in the entry row
 * expansion as one accordion with a shared Save, as in MD. Unsaved edits are
 * reported so collapsing a dirty row asks for confirmation.
 */
const OrderEntryExpansion = ({
  entry,
  entries,
  order,
  readonly = false,
  onDirtyChange,
}: OrderEntryExpansionProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { refreshData } = useOrderData()
  const { patchOrder } = useOrdersApi()

  const saveMixins = async (mixins: Mixins, metadata: Metadata) => {
    const newEntries = entries.map((e) =>
      e.id === entry.id
        ? {
            ...e,
            mixins: { ...e.mixins, ...mixins },
            metadata: {
              ...e.metadata,
              mixins: {
                ...((e.metadata?.mixins as Record<string, string>) ?? {}),
                ...metadata,
              },
            },
          }
        : e
    )
    blockPanel(true)
    try {
      await patchOrder(order.id, { entries: newEntries })
      await refreshData()
      showSuccess(t('orders.data.toast.orderUpdated'))
    } catch (e: unknown) {
      showError(t('orders.toasts.errorUpdate'), getApiErrorMessage(e))
    } finally {
      blockPanel(false)
    }
  }

  const handleDirtyChange = useCallback(
    (isDirty: boolean) => onDirtyChange?.(entry.id, isDirty),
    [onDirtyChange, entry.id]
  )

  const { loadMixins, mixinsAccordion, isMixinsLoading } = useMixinsForm({
    type: SchemaType.ORDER_ENTRY,
    onEdit: () => undefined,
    onEditAccordion: saveMixins,
    onAccordionDirtyChange: handleDirtyChange,
    managerPermissions: !readonly,
  })

  useEffect(() => {
    void loadMixins(
      (entry.metadata?.mixins as Record<string, string>) ?? {},
      entry.mixins ?? {}
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  // Clear the reported dirty flag when the row collapses (unmounts).
  useEffect(
    () => () => onDirtyChange?.(entry.id, false),
    [entry.id, onDirtyChange]
  )

  return (
    // Stop clicks inside the expansion from toggling / navigating the row.
    <div className={styles.expansion} onClick={(e) => e.stopPropagation()}>
      {isMixinsLoading ? (
        <div className={styles.loading}>
          <ProgressSpinner />
        </div>
      ) : mixinsAccordion ? (
        mixinsAccordion
      ) : (
        <EmptyContent
          text={t('orders.tables.entries.emptyMixins')}
          showEmptyIcon={false}
        />
      )}
    </div>
  )
}

export default OrderEntryExpansion
