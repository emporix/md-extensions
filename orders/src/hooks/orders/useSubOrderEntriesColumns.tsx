import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MoneyValue,
  type DataTableColumnProps,
} from '@emporix/component-library'
import type { Entry, Order } from '../../models/Order.model'

const COLUMNS_PATH = 'orders.tables.entries'

const cellStyle = (width: string) => ({
  whiteSpace: 'nowrap' as const,
  width,
  minWidth: '100px',
})

const useSubOrderEntriesColumns = (order: Order) => {
  const { i18n, t } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'productName',
        header: t(`${COLUMNS_PATH}.productName`),
        style: cellStyle('40%'),
        body: (e: Entry) => <div>{e.product?.name || '--'}</div>,
      },
      {
        columnKey: 'productId',
        header: t(`${COLUMNS_PATH}.productId`),
        style: cellStyle('30%'),
        body: (e: Entry) => <div>{e.product?.id || '--'}</div>,
      },
      {
        columnKey: 'quantity',
        header: t(`${COLUMNS_PATH}.quantity`),
        style: cellStyle('15%'),
        align: 'right',
        body: (e: Entry) => <div>{e.orderedAmount}</div>,
      },
      {
        columnKey: 'finalPriceGross',
        header: t(`${COLUMNS_PATH}.finalPriceGross`),
        align: 'right',
        style: cellStyle('15%'),
        body: (e: Entry) => (
          <MoneyValue
            value={e.calculatedPrice?.finalPrice?.grossValue}
            currency={order.currency}
            locale={i18n.language}
          />
        ),
      },
    ],
    [order, i18n.language, t]
  )

  return { columns }
}

export default useSubOrderEntriesColumns
