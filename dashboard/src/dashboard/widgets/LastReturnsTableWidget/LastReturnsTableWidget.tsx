import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useLastReturns } from '../../hooks/useReturns'
import {
  getReturnRequestorDisplayName,
  formatReturnStatus,
  formatReturnDate,
  formatReturnTotal,
  getReturnCreated,
} from '../../helpers/return.helpers'
import type { ReturnApiResponse } from '../../api/returns.api'
import {
  DataTableWidget,
  type TableColumn,
} from '../../components/DataTableWidget'
import { dataTableStyles as styles } from '../../components/dataTableStyles'
import { ROUTES } from '../../data/routes'

const PAGE_SIZE = 10

export const LastReturnsTableWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { returns, loading, error } = useLastReturns(
    appState?.tenant,
    appState?.token
  )

  const columns = useMemo(
    (): TableColumn<ReturnApiResponse>[] => [
      {
        key: 'return',
        header: t('table.return'),
        render: (r) => (
          <a href={ROUTES.return(r.id)} className={styles.idLink}>
            {r.id}
          </a>
        ),
      },
      {
        key: 'requestor',
        header: t('table.requestor'),
        render: (r) => getReturnRequestorDisplayName(r),
      },
      {
        key: 'status',
        header: t('table.status'),
        render: (r) => (
          <span className={styles.status}>
            {formatReturnStatus(r.approvalStatus)}
          </span>
        ),
      },
      {
        key: 'total',
        header: t('table.total'),
        render: (r) => formatReturnTotal(r),
      },
      {
        key: 'date',
        header: t('table.date'),
        render: (r) => formatReturnDate(getReturnCreated(r)),
      },
    ],
    [t]
  )

  return (
    <DataTableWidget
      title={t('returns.title')}
      seeAllHref={ROUTES.returns}
      seeAllLabel={t('returns.seeAll')}
      caption={t('returns.caption')}
      loading={loading}
      error={error ? t(error) : null}
      items={returns.slice(0, PAGE_SIZE)}
      columns={columns}
      getRowKey={(r) => r.id}
      emptyMessage={t('returns.noResults')}
      loadingMessage={t('returns.loading')}
      showNoAccess={!appState?.tenant}
      noAccessMessage={t('returns.signInToView')}
    />
  )
}
