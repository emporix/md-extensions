import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  InputNumber,
  Message,
  MoneyValue,
  PrimaryButton,
  type DataTableColumnProps,
} from '@emporix/component-library'
import type { AddEntry } from '@emporix/api-calls'
import AddEntryDialog from '../entries/AddEntryDialog'
import EntryTableExpansion from './EntryTableExpansion'
import TableActions from '../../shared/TableActions'
import { useOrdersApi } from '../../../hooks/api/orders'
import { trimCloudinaryImage } from '../../../helpers/images'
import {
  addNewEntries,
  formatCurrency,
  getTotalAuthorizedAmount,
  removeDuplicatedEntries,
} from '../../../helpers/orders'
import { Entry, Order, OrderStatus } from '../../../models/Order.model'
import quantityStyles from '../../shared/QuantityStepper.module.scss'
import styles from './Legacy.module.scss'

type EntryTableProps = {
  readonly data: Order
  readonly tableName: string
  readonly readonly?: boolean
  readonly updateOrder?: (order: Order) => void
  readonly refreshFlag?: boolean
}

const toAddEntries = (entries: Entry[]): AddEntry[] =>
  entries.map((entry) => ({ productId: entry.id, quantity: entry.amount }))

/** Entries tab / list expansion for legacy orders (no `calculatedPrice`). */
const EntryTable = ({
  data,
  tableName,
  readonly = false,
  updateOrder,
  refreshFlag,
}: EntryTableProps) => {
  const { t, i18n } = useTranslation()
  const { addEntries } = useOrdersApi()
  const [expandedRows, setExpandedRows] = useState<Entry[]>([])
  const [removedEntries, setRemovedEntries] = useState<AddEntry[]>([])
  const [newEntries, setNewEntries] = useState<AddEntry[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const entries = data.entries ?? []
  const editable = !readonly && data.status !== OrderStatus.COMPLETED
  const totalAuthorizedAmount = getTotalAuthorizedAmount(data)
  const isTotalExceeded =
    totalAuthorizedAmount !== undefined &&
    totalAuthorizedAmount < data.totalPrice

  // Entries with quantity 0 are removals; keep removed ids sticky.
  const handleRemoval = (base: AddEntry[], id?: string): AddEntry[] => {
    const filtered = base.filter((entry) => entry.quantity !== 0)
    if (id !== undefined) filtered.push({ productId: id, quantity: 0 })
    return removeDuplicatedEntries([...removedEntries, ...filtered])
  }

  useEffect(() => {
    setNewEntries([])
    setRemovedEntries([])
  }, [refreshFlag])

  useEffect(() => {
    if (data.entries) setNewEntries(handleRemoval(toAddEntries(data.entries)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly, data])

  const pushEntries = async (next: AddEntry[]) => {
    try {
      const updatedOrder = await addNewEntries(data.id, next, addEntries)
      updateOrder?.(updatedOrder)
    } catch (e) {
      console.error(e)
    }
  }

  const onQuantityChange = (rowData: Entry, quantity: number) => {
    const newIds = newEntries.map((entry) => entry.productId)
    const next = removeDuplicatedEntries(
      [
        ...toAddEntries(entries.filter((entry) => !newIds.includes(entry.id))),
        ...newEntries,
      ].map((entry) =>
        entry.productId === rowData.id ? { ...entry, quantity } : entry
      )
    )
    setNewEntries(next)
    void pushEntries(next)
  }

  const onDelete = async (rowData: Entry) => {
    setRemovedEntries((prev) => [
      ...prev,
      { productId: rowData.id, quantity: 0 },
    ])
    const next = handleRemoval(newEntries, rowData.id)
    setNewEntries(next)
    await pushEntries(next)
  }

  const columns: DataTableColumnProps[] = useMemo(() => {
    const T = `${tableName}.entries.table`
    const money = (value: number) => (
      <MoneyValue
        currency={data.currency}
        value={value}
        locale={i18n.language}
      />
    )
    return [
      { columnKey: 'gap', style: { width: '2rem' }, body: () => <span /> },
      { columnKey: 'expander', expander: true, style: { width: '4rem' } },
      {
        columnKey: 'image',
        style: { width: '3rem' },
        body: (row: Entry) => {
          const url = row.product?.images?.[0]?.url
          return (
            <div className={styles.imageWrapper}>
              {url && (
                <img
                  className={styles.image}
                  src={trimCloudinaryImage(url, 36, 28)}
                  alt={row.product?.name}
                />
              )}
            </div>
          )
        },
      },
      {
        columnKey: 'sku',
        style: { width: '15%' },
        field: 'product.sku',
        header: t(`${T}.id`),
      },
      {
        columnKey: 'name',
        style: { width: '35%' },
        field: 'product.name',
        header: t(`${T}.productName`),
      },
      {
        columnKey: 'orderedAmount',
        style: { width: '7rem', textAlign: 'center' },
        field: 'orderedAmount',
        header: t(`${T}.orderedQty`),
        ...(editable
          ? {
              body: (row: Entry) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <InputNumber
                    className={quantityStyles.stepper}
                    showButtons
                    buttonLayout="horizontal"
                    min={1}
                    value={row.orderedAmount}
                    onChange={(e) => onQuantityChange(row, e.value ?? 0)}
                  />
                </div>
              ),
            }
          : {}),
      },
      {
        columnKey: 'deliveredQty',
        style: { width: '7rem', textAlign: 'center' },
        field: 'mixins.pliPicking.deliveryAmount',
        header: t(`${T}.deliveredQty`),
      },
      {
        columnKey: 'unitPrice',
        field: 'unitPrice',
        align: 'right',
        header: t(`${T}.unitPrice`),
        body: (row: Entry) => money(row.unitPrice),
      },
      {
        columnKey: 'totalPrice',
        field: 'totalPrice',
        align: 'right',
        header: t(`${T}.totalPrice`),
        body: (row: Entry) => money(row.totalPrice),
      },
      { columnKey: 'gapEnd', style: { width: '2rem' }, body: () => <span /> },
      ...(editable
        ? [
            {
              columnKey: 'actions',
              body: (row: Entry) => (
                <TableActions onDelete={() => onDelete(row)} />
              ),
            },
          ]
        : []),
    ] as DataTableColumnProps[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, editable, i18n.language, newEntries, removedEntries, tableName])

  return (
    <div>
      {editable && (
        <AddEntryDialog
          onClose={() => setShowDialog(false)}
          visible={showDialog}
        />
      )}
      {editable && isTotalExceeded && (
        <div className={styles.warning}>
          <Message
            severity="warn"
            text={t(`${tableName}.entries.warning`, {
              totalPrice: formatCurrency(
                data.currency || 'EUR',
                data.totalPrice,
                i18n.language
              ),
              totalAuthorizedAmount: formatCurrency(
                data.currency || 'EUR',
                totalAuthorizedAmount ?? 0,
                i18n.language
              ),
            })}
          />
        </div>
      )}
      <DataTable
        className={styles.entryTable}
        dataKey="id"
        value={entries}
        columns={columns}
        paginator={false}
        showFilter={false}
        expandedRows={expandedRows}
        onRowToggle={(rows) => setExpandedRows(rows as Entry[])}
        rowExpansionTemplate={(entry: Entry) => (
          <EntryTableExpansion
            readonly={readonly}
            entry={entry}
            entries={entries}
            order={data}
          />
        )}
        footer={
          !readonly && (
            <PrimaryButton
              disabled={data.status === OrderStatus.COMPLETED}
              onClick={() => setShowDialog(true)}
            >
              {t(`${tableName}.entries.add`)}
            </PrimaryButton>
          )
        }
      />
    </div>
  )
}

export default EntryTable
