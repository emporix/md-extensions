import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  MoneyValue,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { Item } from '../../models/Quotes.model'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import PriceOnRequestBadge from './PriceOnRequestBadge'
import styles from './QuotesTableExpansion.module.scss'

interface QuotesTableExpansionProps {
  items: Item[]
}

/** The lines of a quote, shown when its list row is expanded. */
const QuotesTableExpansion = (props: QuotesTableExpansionProps) => {
  const { items } = props
  const { t, i18n } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()

  const columns: DataTableColumnProps[] = useMemo(() => {
    const TABLE_NAME = 'quotes.tableExpansion'
    return [
      {
        columnKey: 'gapStart',
        header: '',
        style: { width: '80px', minWidth: '80px' },
        body: () => <span />,
      },
      {
        columnKey: 'name',
        header: t(`${TABLE_NAME}.name`),
        body: (rowData: Item) => getContentLangValue(rowData.product.name),
      },
      {
        columnKey: 'quantity',
        header: t(`${TABLE_NAME}.quantity`),
        align: 'right',
        field: 'quantity.quantity',
      },
      {
        columnKey: 'unit',
        header: t(`${TABLE_NAME}.unit`),
        field: 'quantity.unitCode',
      },
      {
        columnKey: 'unitPrice',
        header: t(`${TABLE_NAME}.unitPrice`),
        align: 'right',
        body: (rowData: Item) => {
          // COP-7125: an item without a price.
          if (!rowData.price) return <PriceOnRequestBadge />
          return (
            <MoneyValue
              currency={rowData.price?.currency}
              value={rowData.price?.newUnitPrice}
              locale={i18n.language}
            />
          )
        },
      },
      {
        columnKey: 'grossPrice',
        header: t(`${TABLE_NAME}.grossPrice`),
        align: 'right',
        body: (rowData: Item) => {
          return (
            <MoneyValue
              currency={rowData?.price?.currency}
              value={rowData?.price?.tax?.prices?.grossValue}
              locale={i18n.language}
            />
          )
        },
      },
      {
        columnKey: 'gapEnd',
        header: '',
        style: { width: '6em' },
        body: () => <span />,
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language])

  return (
    <div className={styles.expansion}>
      {/* A plain Prime table in MD: no paginator, no filter row. */}
      <DataTable
        value={items}
        columns={columns}
        sortOrder={-1}
        paginator={false}
        showFilter={false}
        showEmptyIcon={false}
        emptyMessage={t('global.noDataFound')}
        data-testid="quotes-table-expansion"
      />
    </div>
  )
}

export default QuotesTableExpansion
