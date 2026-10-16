import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Calendar,
  DateValue,
  InputText,
  PrimaryButton,
  useToast,
} from '@emporix/component-library'
import LabeledValue from '../shared/LabeledValue'
import { usePermissions } from '../../context/PermissionsProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useOrdersApi } from '../../hooks/api/orders'
import { getApiErrorMessage } from '../../helpers/api'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { Order, OrderMixins, OrderStatus } from '../../models/Order.model'
import styles from './DeliveryTimeForm.module.scss'

type DeliveryTimeFormValues = { mixins: OrderMixins }

type DeliveryTimeFormProps = {
  readonly order: Order
  /** `stacked` = current order view, `inline` = legacy view. */
  readonly variant: 'stacked' | 'inline'
  readonly labels: {
    from: string
    to: string
    deliveryDate: string
    handover: string
  }
  readonly successToastKey: string
}

/**
 * Delivery time window editor (`mixins.deliveryTime`), editable only while
 * the order is CREATED. MD's `InputMask "99:99"` is replaced by CL `InputText`
 * `type="time"` (same `HH:MM` value) — documented substitute in
 * CL_WIDGET_STATUS.md.
 */
const DeliveryTimeForm = ({
  order,
  variant,
  labels,
  successToastKey,
}: DeliveryTimeFormProps) => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { patchOrder } = useOrdersApi()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const { reset, control, handleSubmit, watch } =
    useForm<DeliveryTimeFormValues>()

  useEffect(() => {
    reset({ mixins: order.mixins ?? {} })
  }, [order.mixins, reset])

  const isOrderCreated = order.status === OrderStatus.CREATED
  const deliveryTimeFrom = watch('mixins.deliveryTime.deliveryTimeFrom')
  const deliveryTimeTo = watch('mixins.deliveryTime.deliveryTimeTo')
  const deliveryDate = watch('mixins.deliveryTime.deliveryDate')
  const emptyText = variant === 'inline' ? '---' : '--'

  const personalHandover = useMemo(() => {
    if (!order.mixins?.deliveryOptions) return emptyText
    return order.mixins.deliveryOptions.personalHandover
      ? t('global.no')
      : t('global.yes')
  }, [order.mixins, t, emptyText])

  const onSubmit = async (data: DeliveryTimeFormValues) => {
    try {
      blockPanel(true)
      await patchOrder(order.id, data)
      showSuccess(t(successToastKey))
    } catch (e: unknown) {
      showError(getApiErrorMessage(e) ?? t('orders.toasts.errorUpdate'))
    } finally {
      blockPanel(false)
    }
  }

  const timeField = (
    name:
      | 'mixins.deliveryTime.deliveryTimeFrom'
      | 'mixins.deliveryTime.deliveryTimeTo',
    label: string,
    readValue: string | undefined
  ) =>
    isOrderCreated ? (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputText
            className={styles.time}
            label={label}
            type="time"
            disabled={!canManage}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
    ) : (
      <LabeledValue label={label}>{readValue}</LabeledValue>
    )

  return (
    <div className={variant === 'inline' ? styles.inline : styles.stacked}>
      <div className={styles.fields}>
        {timeField(
          'mixins.deliveryTime.deliveryTimeFrom',
          labels.from,
          deliveryTimeFrom
        )}
        {timeField(
          'mixins.deliveryTime.deliveryTimeTo',
          labels.to,
          deliveryTimeTo
        )}
        {isOrderCreated ? (
          <Controller
            name="mixins.deliveryTime.deliveryDate"
            control={control}
            render={({ field }) => (
              <Calendar
                className={styles.date}
                label={labels.deliveryDate}
                disabled={!canManage}
                dateFormat={t('global.dateFormat')}
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(
                    e.value instanceof Date ? e.value.toISOString() : undefined
                  )
                }
              />
            )}
          />
        ) : (
          <LabeledValue label={labels.deliveryDate}>
            <DateValue date={deliveryDate} locale={i18n.language} />
          </LabeledValue>
        )}
        <LabeledValue label={labels.handover}>{personalHandover}</LabeledValue>
      </div>
      {isOrderCreated && (
        <PrimaryButton
          className={styles.save}
          disabled={!canManage}
          onClick={handleSubmit(onSubmit)}
        >
          {t('global.save')}
        </PrimaryButton>
      )}
    </div>
  )
}

export default DeliveryTimeForm
