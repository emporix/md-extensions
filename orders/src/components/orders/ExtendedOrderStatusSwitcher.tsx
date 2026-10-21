import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, SecondaryButton, useToast } from '@emporix/component-library'
import { MdSave } from 'react-icons/md'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useOrderData } from '../../contexts/OrderData.provider'
import { useOrdersApi } from '../../hooks/api/orders'
import { getApiErrorMessage } from '../../helpers/api'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import type { ExtendedOrderStatus } from '../../models/Configuration.model'
import type { Order } from '../../models/Order.model'
import styles from './ExtendedOrderStatusSwitcher.module.scss'

type StatusOption = {
  value: string
  key: string
  label: string
  disabled?: boolean
}

const toOption = (status: ExtendedOrderStatus): StatusOption => ({
  value: status.id,
  key: status.key,
  label: status.displayText,
})

/**
 * Dropdown + save button for `mixins.generalAttributes.extendedOrderStatus`.
 * Options follow the configured `possibleTransitions` (MD parity); the current
 * status stays listed but disabled. Shared by the current and legacy views.
 */
const ExtendedOrderStatusSwitcher = ({ order }: { readonly order: Order }) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { configuration } = useConfiguration()
  const { refreshData } = useOrderData()
  const { patchOrder } = useOrdersApi()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const persisted = order.mixins?.generalAttributes?.extendedOrderStatus
  const [extendedOrderStatus, setExtendedOrderStatus] = useState(persisted)

  useEffect(() => {
    setExtendedOrderStatus(persisted)
  }, [persisted])

  const statusOptions = useMemo(() => {
    const all = configuration?.extendedOrderStatuses
    if (!all) return []
    const current = all.find((status) => status.id === extendedOrderStatus)
    if (!current?.possibleTransitions) return all.map(toOption)
    return [
      ...all
        .map(toOption)
        .filter((option) => current.possibleTransitions?.includes(option.key)),
      { ...toOption(current), disabled: true },
    ]
  }, [configuration?.extendedOrderStatuses, extendedOrderStatus])

  const saveStatus = async () => {
    try {
      await patchOrder(order.id, {
        ...order,
        mixins: {
          ...order.mixins,
          generalAttributes: {
            ...order.mixins?.generalAttributes,
            extendedOrderStatus,
          },
        },
      })
      await refreshData()
      showSuccess(t('orders.data.toast.changeStatusSuccess'))
    } catch (e: unknown) {
      showError(t('orders.toasts.errorUpdate'), getApiErrorMessage(e))
    }
  }

  return (
    <div className={styles.switcher}>
      <Dropdown
        className={styles.dropdown}
        disabled={!canManage}
        options={statusOptions}
        optionDisabled="disabled"
        value={extendedOrderStatus ?? null}
        onChange={(e) => setExtendedOrderStatus(String(e.value))}
      />
      <SecondaryButton
        className={styles.saveButton}
        size="small"
        iconOnly
        aria-label={t('orders.tooltips.extendedOrderStatusSave')}
        disabled={!canManage || extendedOrderStatus === persisted}
        onClick={saveStatus}
      >
        <MdSave />
      </SecondaryButton>
    </div>
  )
}

export default ExtendedOrderStatusSwitcher
