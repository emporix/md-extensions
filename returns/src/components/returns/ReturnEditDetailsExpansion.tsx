import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  MoneyValue,
  type DataTableColumnProps,
} from '@emporix/component-library'

import type { ReturnOrder, ReturnOrderItem } from '../../models/Returns.model'

interface ReturnEditDetailsExpansionProps {
  readonly returnOrder: ReturnOrder
}

const ReturnEditDetailsExpansion = ({
  returnOrder,
}: ReturnEditDetailsExpansionProps) => {
  const { t, i18n } = useTranslation()

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'id',
        field: 'id',
        header: t('returns.details.item.id'),
        sortable: true,
      },
      {
        columnKey: 'name',
        field: 'name',
        header: t('returns.details.item.name'),
      },
      {
        columnKey: 'returnCode',
        header: t('returns.details.returnCode'),
        field: 'reason.code',
      },
      {
        columnKey: 'returnReason',
        header: t('returns.details.returnReason'),
        field: 'reason.details',
      },
      {
        columnKey: 'quantity',
        field: 'quantity',
        header: t('returns.details.item.quantity'),
      },
      {
        columnKey: 'total',
        field: 'total',
        align: 'right',
        header: t('returns.details.item.total'),
        body: (item: ReturnOrderItem) => (
          <MoneyValue
            currency={item?.total?.currency}
            locale={i18n.language}
            value={
              item.calculatedPrice?.finalPrice?.grossValue ?? item.total?.value
            }
          />
        ),
      },
    ],
    [i18n.language, t]
  )

  return (
    <DataTable
      dataKey="id"
      value={returnOrder.items}
      columns={columns}
      paginator={false}
      pagination={{ totalRecords: returnOrder.items.length }}
    />
  )
}

export default ReturnEditDetailsExpansion
