import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import {
  buildQuoteHistoryRows,
  type QuoteHistoryRow,
} from '../../helpers/quoteHistory.helpers'
import { Quote } from '../../models/Quotes.model'
import { StylableProps } from '../../helpers/props'
import QuoteStatusBadge from './QuoteStatusBadge'

interface QuotesTabHistoryProps extends StylableProps {
  quote: Quote
}

const NOTHING = '-'
const HISTORY_ROWS_PER_PAGE_OPTIONS = [10, 20, 50]

/**
 * The quote's history as the storefront shows it: the request and every
 * status change with who made it, the status and the comment. A reason is
 * appended to the comment in brackets, as in the storefront.
 */
const QuotesTabHistory = ({ className = '', quote }: QuotesTabHistoryProps) => {
  const { t, i18n } = useTranslation()
  const { getQuoteHistory } = useQuotesApi()
  const { getContentLangValue } = useLocalizedValue()
  const [rows, setRows] = useState<QuoteHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [first, setFirst] = useState(0)
  const [pageSize, setPageSize] = useState(HISTORY_ROWS_PER_PAGE_OPTIONS[0])

  useEffect(() => {
    let current = true
    setLoading(true)
    setFailed(false)
    getQuoteHistory(quote.id)
      .then((entries) => {
        if (current) setRows(buildQuoteHistoryRows(quote, entries ?? []))
      })
      .catch((error: unknown) => {
        console.error(error)
        if (current) setFailed(true)
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
    // Reloaded when the quote reloads (a status change refreshes it).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `quote` is read for its customer and creation date only
  }, [quote.id, quote.status, getQuoteHistory])

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'date',
        header: t('quotes.tabs.history.changeDate'),
        body: (row: QuoteHistoryRow) =>
          row.date
            ? row.kind === 'created'
              ? new Date(row.date).toLocaleDateString(i18n.language)
              : new Date(row.date).toLocaleString(i18n.language)
            : NOTHING,
      },
      {
        columnKey: 'event',
        header: t('quotes.tabs.history.event'),
        body: (row: QuoteHistoryRow) =>
          row.kind === 'created'
            ? t('quotes.tabs.history.initialRequest')
            : t('quotes.tabs.history.statusChanged', {
                status: t(`quotes.status.${row.status}`, {
                  defaultValue: row.status,
                }),
              }),
      },
      {
        columnKey: 'changedBy',
        header: t('quotes.tabs.history.changedBy'),
        body: (row: QuoteHistoryRow) => row.changedBy || NOTHING,
      },
      {
        columnKey: 'status',
        header: t('quotes.tabs.history.status'),
        body: (row: QuoteHistoryRow) =>
          row.status ? <QuoteStatusBadge status={row.status} /> : NOTHING,
      },
      {
        columnKey: 'comment',
        header: t('quotes.tabs.history.comment'),
        body: (row: QuoteHistoryRow) => {
          const reason = row.reason ? getContentLangValue(row.reason) : ''
          if (!row.comment && !reason) return NOTHING
          return [row.comment, reason && `(${reason})`]
            .filter(Boolean)
            .join(' ')
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` follows i18n.language
    [i18n.language, getContentLangValue]
  )

  if (failed) {
    return (
      <div className={className} data-testid="quote-history-error">
        {t('quotes.tabs.history.loadError')}
      </div>
    )
  }

  return (
    <div className={className}>
      <DataTable
        value={rows}
        columns={columns}
        loading={loading}
        showFilter={false}
        pagination={{
          first,
          rows: pageSize,
          rowsPerPageOptions: HISTORY_ROWS_PER_PAGE_OPTIONS,
        }}
        onPage={(event) => {
          setFirst(event.first)
          setPageSize(event.rows)
        }}
        currentPageReportTemplate={t('global.pagination')}
        emptyMessage={t('global.noDataFound')}
        data-testid="quote-history-table"
      />
    </div>
  )
}

export default QuotesTabHistory
