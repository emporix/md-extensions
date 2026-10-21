import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InputNumber,
  MoneyValue,
  type DataTableColumnProps,
  type InputNumberChangeEvent,
} from '@emporix/component-library'
import type { AddEntry } from '@emporix/api-calls'
import OrderTooltip, {
  type OrderTooltipConfig,
} from '../../components/orders/OrderTooltip'
import { useOrderData } from '../../contexts/OrderData.provider'
import { useOrdersApi } from '../api/orders'
import { useLocalizedValue } from '../useLocalizedValue'
import { usePermissions } from '../../context/PermissionsProvider'
import { trimCloudinaryImage } from '../../helpers/images'
import { addNewEntries, removeDuplicatedEntries } from '../../helpers/orders'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { Entry, Order, OrderStatus } from '../../models/Order.model'
import quantityStyles from '../../components/shared/QuantityStepper.module.scss'
import styles from './columns.module.scss'

const COLUMNS_PATH = 'orders.tables.entries'

const useEntriesColumns = (
  order: Order,
  readonly = false,
  withMixins = true
) => {
  const { updateOrder, newEntries, setNewEntries } = useOrderData()
  const { i18n, t } = useTranslation()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { addEntries } = useOrdersApi()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.ORDERS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_MANAGER)
  const locale = i18n.language

  const feesNet = (item: Entry) =>
    item.calculatedPrice?.fees?.reduce((sum, f) => sum + f.price?.netValue, 0)

  const feesGross = (item: Entry) =>
    item.calculatedPrice?.fees?.reduce((sum, f) => sum + f.price?.grossValue, 0)

  const getFeeTooltipConfig = (item: Entry): OrderTooltipConfig => ({
    totalLabel: t(`${COLUMNS_PATH}.total`),
    totalNet: feesNet(item) ?? 0,
    totalGross: feesGross(item) ?? 0,
    items:
      item.calculatedPrice?.fees?.map((f) => ({
        id: f.id,
        label: getContentLangValue(f.name),
        net: f.price?.netValue,
        gross: f.price?.grossValue,
      })) ?? [],
  })

  const getDiscountTooltipConfig = (item: Entry): OrderTooltipConfig => ({
    totalLabel: t(`${COLUMNS_PATH}.total`),
    totalNet: item.calculatedPrice?.totalDiscount?.price?.netValue ?? 0,
    totalGross: item.calculatedPrice?.totalDiscount?.price?.grossValue ?? 0,
    items:
      item.calculatedPrice?.totalDiscount?.appliedDiscounts?.map((d) => ({
        id: d.id,
        label: order.discounts?.find((od) => od.id === d.id)?.code || d.id,
        net: d.price?.netValue,
        gross: d.price?.grossValue,
      })) ?? [],
  })

  const onQuantityChange = useCallback(
    async (entry: Entry, ev: InputNumberChangeEvent) => {
      const newProductIds = newEntries.map((e) => e.productId)
      const remainingEntries: AddEntry[] = order.entries
        .filter((e) => !newProductIds.includes(e.id))
        .map((e) => ({ productId: e.id, quantity: e.amount }))
      const combinedEntries = [...remainingEntries, ...newEntries].map((e) =>
        e.productId === entry.id ? { ...e, quantity: ev.value ?? 0 } : e
      )
      const deduplicated = removeDuplicatedEntries(combinedEntries)
      setNewEntries(deduplicated)
      try {
        updateOrder(await addNewEntries(order.id, deduplicated, addEntries))
      } catch (e) {
        console.error(e)
      }
    },
    [newEntries, order, setNewEntries, updateOrder, addEntries]
  )

  const columns: DataTableColumnProps[] = useMemo(() => {
    const editable =
      canManage && !readonly && order.status !== OrderStatus.COMPLETED
    const money = (value: number | undefined) => (
      <MoneyValue value={value} currency={order.currency} locale={locale} />
    )
    return [
      ...(withMixins
        ? [{ columnKey: 'expander', expander: true, style: { width: '3em' } }]
        : []),
      {
        columnKey: 'image',
        header: t(`${COLUMNS_PATH}.image`),
        body: (e: Entry) => {
          const imageUrl = e.product?.images?.[0]?.url
          return imageUrl ? (
            <img
              className={styles.thumb}
              src={trimCloudinaryImage(imageUrl, 32, 32)}
              alt={imageUrl}
            />
          ) : (
            <div className={styles.thumbPlaceholder} />
          )
        },
      },
      {
        columnKey: 'productId',
        header: t(`${COLUMNS_PATH}.productId`),
        body: (e: Entry) => <div>{e.product?.id || '--'}</div>,
      },
      {
        columnKey: 'productName',
        header: t(`${COLUMNS_PATH}.productName`),
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => <div>{e.product?.name || '--'}</div>,
      },
      {
        columnKey: 'quantity',
        header: t(`${COLUMNS_PATH}.quantity`),
        align: editable ? 'left' : 'right',
        body: (e: Entry) =>
          editable ? (
            // Stop row-toggle / row-click while stepping the quantity.
            <div onClick={(ev) => ev.stopPropagation()}>
              <InputNumber
                className={quantityStyles.stepper}
                showButtons
                buttonLayout="horizontal"
                min={1}
                value={e.orderedAmount}
                onChange={(ev) => void onQuantityChange(e, ev)}
              />
            </div>
          ) : (
            <div>{e.orderedAmount}</div>
          ),
      },
      {
        columnKey: 'unitPriceNet',
        header: t(`${COLUMNS_PATH}.unitPriceNet`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => money(e.calculatedUnitPrice?.netValue),
      },
      {
        columnKey: 'unitPriceGross',
        header: t(`${COLUMNS_PATH}.unitPriceGross`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => money(e.calculatedUnitPrice?.grossValue),
      },
      {
        columnKey: 'priceGross',
        header: t(`${COLUMNS_PATH}.priceGross`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => money(e.calculatedPrice?.price?.grossValue),
      },
      {
        columnKey: 'fees',
        header: t(`${COLUMNS_PATH}.fees`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => {
          const value = feesGross(e)
          return (
            <div className={styles.moneyWithTooltip}>
              <OrderTooltip
                display={!!value}
                config={getFeeTooltipConfig(e)}
                currency={order.currency}
              />
              {money(value)}
            </div>
          )
        },
      },
      {
        columnKey: 'discounts',
        header: t(`${COLUMNS_PATH}.discounts`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => {
          const gross = e.calculatedPrice?.totalDiscount?.price?.grossValue
          const value = gross === undefined ? undefined : -gross
          return (
            <div className={styles.moneyWithTooltip}>
              <OrderTooltip
                display={!!value}
                config={getDiscountTooltipConfig(e)}
                currency={order.currency}
              />
              {money(value)}
            </div>
          )
        },
      },
      {
        columnKey: 'uplift',
        header: t(`${COLUMNS_PATH}.uplift`),
        align: 'right',
        body: (e: Entry) => (
          <div>{e.calculatedPrice?.upliftValue?.grossValue || '--'}</div>
        ),
      },
      {
        columnKey: 'finalPriceNet',
        header: t(`${COLUMNS_PATH}.finalPriceNet`),
        align: 'right',
        style: { whiteSpace: 'nowrap' },
        body: (e: Entry) => money(e.calculatedPrice?.finalPrice?.netValue),
      },
      {
        columnKey: 'tax',
        header: t(`${COLUMNS_PATH}.tax`),
        align: 'right',
        body: (e: Entry) => money(e.calculatedPrice?.finalPrice?.taxValue),
      },
      {
        columnKey: 'finalPriceGross',
        header: t(`${COLUMNS_PATH}.finalPriceGross`),
        align: 'right',
        style: { whiteSpace: 'nowrap', paddingRight: '1.5rem' },
        body: (e: Entry) => money(e.calculatedPrice?.finalPrice?.grossValue),
      },
    ] as DataTableColumnProps[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order,
    locale,
    contentLanguage,
    canManage,
    readonly,
    withMixins,
    onQuantityChange,
  ])

  return { columns }
}

export default useEntriesColumns
