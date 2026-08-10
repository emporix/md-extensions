import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  Dropdown,
  InputText,
  MoneyValue,
  type DataTableColumnProps,
} from '@emporix/component-library'

import { useReturnForm } from '../../contexts/ReturnForm.provider'
import type { Order } from '../../models/Order.model'
import type { ReturnEntry } from '../../models/Returns.model'

interface ReturnAddProductsExpansionProps {
  readonly readonly?: boolean
  readonly order: Order
  readonly onSelect: (orderId: string, entries: ReturnEntry[]) => unknown
}

const ReturnAddProductsExpansion = ({
  order,
  onSelect,
  readonly = false,
}: ReturnAddProductsExpansionProps) => {
  const { t, i18n } = useTranslation()
  const { selectedEntriesMap } = useReturnForm()
  const [selectedEntries, setSelectedEntries] = useState<ReturnEntry[]>(
    selectedEntriesMap.get(order.id) ?? []
  )

  useEffect(() => {
    onSelect(order.id, selectedEntries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntries])

  const data = useMemo(
    (): ReturnEntry[] =>
      order.entries.map((entry) => ({
        ...entry,
        quantity: entry.amount,
        reason: { code: '', details: '' },
      })),
    [order.entries]
  )

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
        field: 'product.name',
        header: t('returns.details.item.name'),
      },
      {
        columnKey: 'returnCode',
        header: t('returns.details.returnCode'),
        field: 'reason.code',
        hidden: readonly,
        body: (entry: ReturnEntry) => {
          if (!selectedEntries.some((e) => e.id === entry.id)) {
            return '--'
          }
          return (
            <InputText
              value={entry.reason?.code ?? ''}
              onChange={(e) => {
                const next = e.target.value
                setSelectedEntries((prev) =>
                  prev.map((item) =>
                    item.id === entry.id
                      ? { ...item, reason: { ...item.reason, code: next } }
                      : item
                  )
                )
              }}
            />
          )
        },
      },
      {
        columnKey: 'returnReason',
        header: t('returns.details.returnReason'),
        field: 'reason.details',
        hidden: readonly,
        body: (entry: ReturnEntry) => {
          if (!selectedEntries.some((e) => e.id === entry.id)) {
            return '--'
          }
          return (
            <InputText
              value={entry.reason?.details ?? ''}
              onChange={(e) => {
                const next = e.target.value
                setSelectedEntries((prev) =>
                  prev.map((item) =>
                    item.id === entry.id
                      ? { ...item, reason: { ...item.reason, details: next } }
                      : item
                  )
                )
              }}
            />
          )
        },
      },
      {
        columnKey: 'amount',
        field: 'amount',
        header: t('returns.details.item.quantity'),
        hidden: readonly,
        body: (entry: ReturnEntry) => {
          if (!selectedEntries.some((e) => e.id === entry.id)) {
            return entry.amount
          }
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                value={String(entry.quantity || entry.amount)}
                options={Array.from({ length: entry.amount }, (_, i) => ({
                  label: String(i + 1),
                  value: String(i + 1),
                }))}
                onChange={(e) => {
                  const next = Number(e.value)
                  setSelectedEntries((prev) =>
                    prev.map((item) =>
                      item.id === entry.id ? { ...item, quantity: next } : item
                    )
                  )
                }}
              />
            </div>
          )
        },
      },
      {
        columnKey: 'total',
        field: 'total',
        align: 'right',
        header: t('returns.details.item.total'),
        hidden: readonly,
        body: (entry: ReturnEntry) => (
          <MoneyValue
            currency={order.currency}
            locale={i18n.language}
            value={
              entry.calculatedPrice?.finalPrice?.grossValue ?? entry.totalPrice
            }
          />
        ),
      },
    ],

    [i18n.language, t, selectedEntries, readonly, order.currency]
  )

  return (
    <DataTable
      dataKey="id"
      value={data}
      columns={columns.filter((column) => !column.hidden)}
      selectionMode={readonly ? null : 'multiple'}
      selection={selectedEntries}
      onSelectionChange={(selection) =>
        setSelectedEntries(selection as ReturnEntry[])
      }
      pagination={{ totalRecords: data.length }}
      paginator={false}
    />
  )
}

export default ReturnAddProductsExpansion
