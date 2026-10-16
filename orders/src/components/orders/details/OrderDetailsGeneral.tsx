import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import OrderDetailsGeneralRow from './OrderDetailsGeneralRow'
import OrderDetailsGeneralTotalRow from './OrderDetailsGeneralTotalRow'
import OrderDetailsField from './OrderDetailsField'
import OrderTooltip, { type OrderTooltipConfig } from '../OrderTooltip'
import ExtendedOrderStatusSwitcher from '../ExtendedOrderStatusSwitcher'
import LinkWithIcon from '../../shared/LinkWithIcon'
import { useOrderData } from '../../../contexts/OrderData.provider'
import {
  HOST_CART_PATH,
  HOST_QUOTE_PATH,
  orderDetailPath,
} from '../../../constants/paths'
import styles from './OrderDetails.module.scss'

const T_PATH = 'orders.forms.order.fields'

const negate = (value: number | undefined) => (value ? -value : value)

const OrderDetailsGeneral = () => {
  const { i18n, t } = useTranslation()
  const { order } = useOrderData()
  const price = order?.calculatedPrice

  const discountsTooltipConfig: OrderTooltipConfig = useMemo(
    () => ({
      totalLabel: t('global.total'),
      totalNet: price?.totalDiscount?.price?.netValue || 0,
      totalGross: price?.totalDiscount?.price?.grossValue || 0,
      items:
        price?.totalDiscount?.appliedDiscounts?.map((d) => ({
          id: d.id,
          label: order?.discounts?.find((od) => od.id === d.id)?.code || d.id,
          gross: d.price?.grossValue,
          net: d.price?.netValue,
        })) || [],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order, i18n.language]
  )

  return (
    <div className={styles.general}>
      <div className={styles.priceTable}>
        <OrderDetailsGeneralRow
          variant="header"
          net={t(`${T_PATH}.net`)}
          gross={t(`${T_PATH}.gross`)}
        />
        <OrderDetailsGeneralRow
          name={t(`${T_PATH}.subtotal`)}
          net={price?.price?.netValue}
          gross={price?.price?.grossValue}
        />
        <OrderDetailsGeneralRow
          name={t(`${T_PATH}.fees`)}
          net={price?.fees?.netValue}
          gross={price?.fees?.grossValue}
        />
        <OrderDetailsGeneralRow
          name={t(`${T_PATH}.shipping`)}
          net={price?.shipping?.netValue}
          gross={price?.shipping?.grossValue}
        />
        <OrderDetailsGeneralRow
          net={negate(price?.totalDiscount?.price?.netValue)}
          gross={negate(price?.totalDiscount?.price?.grossValue)}
          name={
            <div className={styles.nameWithIcon}>
              <div>{t(`${T_PATH}.discounts`)}</div>
              <OrderTooltip
                display={!!price?.totalDiscount}
                currency={order?.currency || ''}
                config={discountsTooltipConfig}
              />
            </div>
          }
        />
        <OrderDetailsGeneralRow
          name={t(`${T_PATH}.uplift`)}
          gross={price?.upliftValue?.grossValue}
        />
        <OrderDetailsGeneralTotalRow
          net={price?.finalPrice?.netValue ?? 0}
          gross={price?.finalPrice?.grossValue ?? 0}
        />
        <OrderDetailsGeneralRow variant="header" name={t(`${T_PATH}.taxes`)} />
        {price?.finalPrice?.taxAggregate?.lines
          ?.filter((line) => !!line.taxRate)
          .map((line, index) => (
            <OrderDetailsGeneralRow
              key={`${line.taxCode}${index}`}
              name={<div className={styles.taxRate}>{line.taxRate}%</div>}
              gross={line.taxValue}
            />
          ))}
        <OrderDetailsGeneralRow
          variant="bold"
          name={t(`${T_PATH}.totalTax`)}
          gross={price?.finalPrice?.taxValue}
        />
      </div>

      <div className={styles.sideFields}>
        <OrderDetailsField
          alignEnd
          isLoading={!order}
          name={t(`${T_PATH}.cartNumber`)}
          value={
            order?.cartId && (
              <LinkWithIcon
                label={order.cartId}
                hostHref={HOST_CART_PATH(order.cartId)}
              />
            )
          }
        />
        {order?.quoteId && (
          <OrderDetailsField
            alignEnd
            name={t(`${T_PATH}.quoteNumber`)}
            value={
              <LinkWithIcon
                label={order.quoteId}
                hostHref={HOST_QUOTE_PATH(order.quoteId)}
              />
            }
          />
        )}
        {order?.masterOrder && (
          <OrderDetailsField
            alignEnd
            name={t(`${T_PATH}.masterOrderNumber`)}
            value={
              <LinkWithIcon
                label={order.masterOrder}
                to={orderDetailPath(order.masterOrder)}
              />
            }
          />
        )}
        <OrderDetailsField
          alignEnd
          isLoading={!order}
          name={t(`${T_PATH}.paymentType`)}
          value={order?.payments?.[0]?.method?.toUpperCase()}
        />
        <OrderDetailsField
          alignEnd
          isLoading={!order}
          name={t(`${T_PATH}.extendedOrderStatus`)}
          value={order && <ExtendedOrderStatusSwitcher order={order} />}
        />
        {order?.vendor?.id && (
          <OrderDetailsField
            alignEnd
            name={t(`${T_PATH}.vendor`)}
            value={order.vendor.name || order.vendor.id}
          />
        )}
        {order?.restriction && (
          <OrderDetailsField
            alignEnd
            name={t('orders.data.label.restriction')}
            value={order.restriction}
          />
        )}
      </div>
    </div>
  )
}

export default OrderDetailsGeneral
