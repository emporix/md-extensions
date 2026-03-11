import { useMemo } from 'react'
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useAbandonedCarts } from '../../hooks/useAbandonedCarts'
import {
  getCartCustomerDisplay,
  formatCartValue,
  formatCartDate,
  getCartCreatedAt,
} from '../../helpers/cart.helpers'
import type { CartApiResponse } from '../../api/carts.api'
import {
  DataTableWidget,
  type TableColumn,
} from '../../components/DataTableWidget'
import { dataTableStyles as styles } from '../../components/dataTableStyles'
import { ROUTES } from '../../data/routes'

const PAGE_SIZE = 10

export const AbandonedCartsTableWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { carts, loading, error } = useAbandonedCarts(
    appState?.tenant,
    appState?.token,
    site?.code,
    PAGE_SIZE
  )

  const columns = useMemo(
    (): TableColumn<CartApiResponse>[] => [
      {
        key: 'cart',
        header: t('table.cart'),
        render: (cart) => (
          <a href={ROUTES.cart(cart.id)} className={styles.idLink}>
            {cart.id}
          </a>
        ),
      },
      {
        key: 'customer',
        header: t('table.customer'),
        render: (cart) => (
          <a
            href={ROUTES.customer(cart.customerId ?? '')}
            className={styles.idLink}
          >
            {getCartCustomerDisplay(cart)}
          </a>
        ),
      },
      {
        key: 'value',
        header: t('table.value'),
        render: (cart) => formatCartValue(cart),
      },
      {
        key: 'created',
        header: t('table.created'),
        render: (cart) => formatCartDate(getCartCreatedAt(cart)),
      },
    ],
    [t]
  )

  return (
    <DataTableWidget
      title={t('abandonedCarts.title')}
      seeAllHref={ROUTES.carts}
      seeAllLabel={t('abandonedCarts.seeAll')}
      caption={t('abandonedCarts.caption')}
      loading={loading}
      error={error ? t(error) : null}
      items={carts.slice(0, PAGE_SIZE)}
      columns={columns}
      getRowKey={(cart) => cart.id}
      emptyMessage={t('abandonedCarts.noResults')}
      loadingMessage={t('abandonedCarts.loading')}
      showNoAccess={!appState?.tenant}
      noAccessMessage={t('abandonedCarts.signInToView')}
    />
  )
}
