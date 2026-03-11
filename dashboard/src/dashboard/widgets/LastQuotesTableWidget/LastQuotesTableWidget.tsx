import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastQuotes } from '../../hooks/useLastQuotes'
import {
  getQuoteCustomerDisplayName,
  formatQuoteStatus,
  formatQuoteDate,
  formatQuoteTotal,
  getQuoteCreated,
} from '../../helpers/quote.helpers'
import type { QuoteApiResponse } from '../../api/quotes.api'
import {
  DataTableWidget,
  type TableColumn,
} from '../../components/DataTableWidget'
import { dataTableStyles as styles } from '../../components/dataTableStyles'
import { ROUTES } from '../../data/routes'

const PAGE_SIZE = 10

export const LastQuotesTableWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { quotes, loading, error } = useLastQuotes(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const columns = useMemo(
    (): TableColumn<QuoteApiResponse>[] => [
      {
        key: 'quote',
        header: t('table.quote'),
        render: (quote) => (
          <a href={ROUTES.quote(quote.id)} className={styles.idLink}>
            {quote.id}
          </a>
        ),
      },
      {
        key: 'customer',
        header: t('table.customer'),
        render: (quote) => getQuoteCustomerDisplayName(quote),
      },
      {
        key: 'status',
        header: t('table.status'),
        render: (quote) => (
          <span className={styles.status}>
            {formatQuoteStatus(quote.status)}
          </span>
        ),
      },
      {
        key: 'total',
        header: t('table.total'),
        render: (quote) => formatQuoteTotal(quote),
      },
      {
        key: 'date',
        header: t('table.date'),
        render: (quote) => formatQuoteDate(getQuoteCreated(quote)),
      },
    ],
    [t]
  )

  return (
    <DataTableWidget
      title={t('quotes.title')}
      seeAllHref={ROUTES.quotes}
      seeAllLabel={t('quotes.seeAll')}
      caption={t('quotes.caption')}
      loading={loading}
      error={error ? t(error) : null}
      items={quotes.slice(0, PAGE_SIZE)}
      columns={columns}
      getRowKey={(quote) => quote.id}
      emptyMessage={t('quotes.noResults')}
      loadingMessage={t('quotes.loading')}
    />
  )
}
