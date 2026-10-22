import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dropdown,
  PrimaryButton,
  ProgressSpinner,
  SecondaryButton,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import EmptyContent from '../components/shared/EmptyContent'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import OrderDetails from '../components/orders/details/OrderDetails'
import OrderEntries from '../components/orders/entries/OrderEntries'
import EntryTable from '../components/orders/legacy/EntryTable'
import OrderData from '../components/orders/legacy/OrderData'
import OrderPaymentInfo from '../components/orders/payment/OrderPaymentInfo'
import useMixinsForm from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import { useOrderData } from '../contexts/OrderData.provider'
import { useUIBlocker } from '../context/UIBlocker'
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import { usePermissions } from '../context/PermissionsProvider'
import { useOrdersApi } from '../hooks/api/orders'
import { useTabs } from '../hooks/useTabs'
import { getApiErrorMessage } from '../helpers/api'
import { getTotalAuthorizedAmount } from '../helpers/orders'
import { EmployeeDomains, VendorDomains } from '../configs/accessControls'
import { ordersListPath } from '../constants/paths'
import type { Mixins } from '../models/Mixins.model'
import { Order, OrderStatus } from '../models/Order.model'
import { SchemaType } from '../models/Schema.model'
import styles from './OrdersPage.module.scss'

const DATA_TAB = 'order-data'
const ENTRIES_TAB = 'entries'
const PAYMENT_TAB = 'payment'
const AUDIT_LOG_TAB = 'audit-log'
const TABLE_NAME = 'orders.table'
export const PAYMENT_GATEWAY_FEATURE_TOGGLE_NAME = 'PAYMENT_GATEWAY'

type StatusOption = { label: string; value: string; disabled?: boolean }

/** True when the entries differ from the persisted order (MD parity). */
const entriesChanged = (original: Order, current: Order) => {
  const originalEntries = original.entries ?? []
  const currentEntries = current.entries ?? []
  if (originalEntries.length !== currentEntries.length) return true
  return currentEntries.some(
    (entry, i) =>
      entry.id !== originalEntries[i].id ||
      entry.amount !== originalEntries[i].amount
  )
}

/** Entry changes may only be saved while the authorized amount covers them. */
const canSaveEntries = (order: Order) => {
  const totalAuthorizedAmount = getTotalAuthorizedAmount(order)
  const isNotCompleted = order.status !== OrderStatus.COMPLETED
  if (isNotCompleted && totalAuthorizedAmount === undefined) {
    return true
  }
  return (
    isNotCompleted &&
    (order.calculatedPrice?.finalPrice?.grossValue ?? order.totalPrice) <=
      (totalAuthorizedAmount ?? 0)
  )
}

const OrderViewPage = () => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const {
    getStatusChanges,
    changeOrderStatus,
    putOrder,
    patchOrder,
    syncOrder,
  } = useOrdersApi()
  const { order, isLoading, loadError, refreshData, updateOrder, refreshFlag } =
    useOrderData()
  const toggles = useFeatureToggles()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)
  const paymentTabEnabled = toggles.isToggleValid(
    PAYMENT_GATEWAY_FEATURE_TOGGLE_NAME
  )

  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [newStatus, setNewStatus] = useState<OrderStatus>()
  const [entriesUpdated, setEntriesUpdated] = useState(false)

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    if (!order) return
    const { key, url } = mixinMetadata
    const metadataMixins = {
      ...((order.metadata?.mixins as Record<string, string> | undefined) ?? {}),
      [key]: url,
    }
    blockPanel(true)
    try {
      await patchOrder(order.id, {
        mixins: { ...order.mixins, [key]: data },
        metadata: { mixins: metadataMixins },
      })
      await refreshData()
      showSuccess(t('orders.data.toast.orderUpdated'))
    } catch (e: unknown) {
      showError(t('orders.toasts.errorUpdate'), getApiErrorMessage(e))
    } finally {
      blockPanel(false)
    }
  }

  const { loadMixins, mixinsForms, isMixinsLoading } = useMixinsForm({
    type: SchemaType.ORDER,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  useEffect(() => {
    if (!order?.mixins || !order.metadata?.mixins) return
    void loadMixins(
      order.metadata.mixins as Record<string, string>,
      order.mixins
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const fetchPossibleStatuses = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const possibleStatuses = (await getStatusChanges(orderId)) ?? []
        const possibleValues = possibleStatuses.map((s) => String(s.status))
        setStatuses([
          ...possibleValues.map((value) => ({ value, label: value })),
          ...(status
            ? [
                {
                  value: status,
                  label: status,
                  disabled: !possibleValues.includes(status),
                },
              ]
            : []),
        ])
      } catch (e: unknown) {
        showError(getApiErrorMessage(e) ?? t('orders.toasts.errorFetch'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getStatusChanges]
  )

  useEffect(() => {
    if (!order?.id) return
    void (async () => {
      try {
        const originalOrder = await syncOrder(order.id)
        setNewStatus(order.status)
        await fetchPossibleStatuses(order.id, order.status)
        setEntriesUpdated(
          entriesChanged(originalOrder, order) && canSaveEntries(order)
        )
      } catch (e) {
        console.error(e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const saveOrderStatusChange = async () => {
    if (!order?.id || !newStatus) return
    try {
      blockPanel(true)
      await changeOrderStatus(order.id, newStatus)
      showSuccess(t('orders.data.toast.changeStatusSuccess'))
      await fetchPossibleStatuses(order.id, order.status)
    } catch (e: unknown) {
      showError(getApiErrorMessage(e) ?? t('orders.toasts.errorUpdate'))
    } finally {
      await refreshData()
      blockPanel(false)
    }
  }

  const saveOrder = async () => {
    if (!order) return
    if (!entriesUpdated) {
      await saveOrderStatusChange()
      return
    }
    blockPanel(true)
    try {
      await putOrder(order)
      await refreshData()
      showSuccess(t('orders.data.toast.orderUpdated'))
    } catch (e: unknown) {
      showError(t('orders.toasts.errorUpdate'), getApiErrorMessage(e))
    } finally {
      blockPanel(false)
    }
  }

  const loading = (
    <div className={styles.loading}>
      <ProgressSpinner />
    </div>
  )

  const loadFailed = (
    <EmptyContent
      text={t('orders.toasts.errorFetch')}
      buttonLabel={t('global.retry')}
      action={() => {
        void refreshData()
      }}
    />
  )

  const tabContent = (ready: ReactNode) => {
    if (isLoading) return loading
    if (loadError || !order?.id) return loadFailed
    return ready
  }

  const tabIds = useMemo(
    () => [
      DATA_TAB,
      ENTRIES_TAB,
      ...(paymentTabEnabled ? [PAYMENT_TAB] : []),
      ...(isMixinsLoading ? [] : mixinsForms.map((form) => form.id)),
      ...(canViewAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [paymentTabEnabled, isMixinsLoading, mixinsForms, canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  const tabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = [
      {
        id: DATA_TAB,
        label: t('orders.data.tab.data'),
        content: tabContent(
          order?.calculatedPrice ? <OrderDetails /> : <OrderData />
        ),
      },
      {
        id: ENTRIES_TAB,
        label: t('orders.data.tab.entries'),
        content: tabContent(
          order?.calculatedPrice ? (
            <OrderEntries />
          ) : order ? (
            <EntryTable
              readonly={!canManage}
              data={order}
              updateOrder={updateOrder}
              refreshFlag={refreshFlag}
              tableName={TABLE_NAME}
            />
          ) : null
        ),
      },
    ]
    if (paymentTabEnabled) {
      items.push({
        id: PAYMENT_TAB,
        label: t('orders.data.tab.payment'),
        content: tabContent(<OrderPaymentInfo />),
      })
    }
    if (!isMixinsLoading) {
      items.push(
        ...mixinsForms.map((form) => ({
          id: form.id,
          label: form.name,
          content: form.template,
        }))
      )
    }
    if (canViewAuditLog) {
      items.push({
        id: AUDIT_LOG_TAB,
        label: t('auditLog.entityChangelog.tab'),
        disabled: !order?.id,
        content: order?.id ? (
          <EntityChangelogTab
            entity="order"
            entityId={order.id}
            isActive={activeTab === AUDIT_LOG_TAB}
          />
        ) : null,
      })
    }
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    order,
    isLoading,
    loadError,
    canManage,
    refreshFlag,
    paymentTabEnabled,
    mixinsForms,
    isMixinsLoading,
    canViewAuditLog,
    activeTab,
    refreshData,
  ])

  return (
    <>
      <HeaderSection
        title={t('orders.singular')}
        subtitle={order?.id}
        backTo={ordersListPath()}
        moduleActions={
          <div className={styles.headerActions}>
            <Dropdown
              className={styles.statusDropdown}
              disabled={!canManage}
              value={newStatus ?? null}
              options={statuses}
              optionDisabled="disabled"
              onChange={(e) => setNewStatus(e.value as OrderStatus)}
            />
            <PrimaryButton
              disabled={
                !entriesUpdated &&
                (order?.status === newStatus ||
                  newStatus === undefined ||
                  !canManage)
              }
              onClick={saveOrder}
            >
              {t('global.save')}
            </PrimaryButton>
            <SecondaryButton
              disabled={!canManage}
              onClick={() => refreshData()}
            >
              {t('global.discard')}
            </SecondaryButton>
          </div>
        }
      />
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? DATA_TAB}
        onTabChange={onTabChange}
      />
    </>
  )
}

export default OrderViewPage
