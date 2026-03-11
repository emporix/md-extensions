import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useCustomers } from '../../hooks/useCustomers'
import {
  getCustomerInitials,
  getCustomerAvatarColor,
  getCustomerDisplayName,
  formatRegistrationDate,
} from '../../helpers/customer.helpers'
import { ROUTES } from '../../data/routes'
import styles from './CustomersWidget.module.scss'

export const CustomersWidget = () => {
  const { appState, site } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { customers, total, loading, error } = useCustomers(
    appState?.tenant,
    appState?.token,
    site?.code
  )

  const displayTotal = total ?? customers.length
  const showTable = !loading && !error

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {t('customers.title', { count: displayTotal })}
        </h3>
        <a href={ROUTES.customers} className={styles.seeAllLink}>
          {t('customers.seeAll')}
        </a>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <span>{t('customers.loading')}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{t(error)}</span>
        </div>
      )}

      {showTable && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              {t('customers.caption')}
            </caption>
            <thead>
              <tr>
                <th className={styles.th} scope="col">
                  {t('table.customer')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.company')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.status')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.registrationDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    {t('customers.noResults')}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className={styles.row}>
                    <td className={styles.td}>
                      <a
                        href={ROUTES.customer(customer.id)}
                        className={`${styles.customerCell} ${styles.customerLink}`}
                      >
                        <span
                          className={styles.avatar}
                          style={{
                            backgroundColor: getCustomerAvatarColor(customer),
                          }}
                          aria-hidden
                        >
                          {getCustomerInitials(customer)}
                        </span>
                        <div className={styles.customerInfo}>
                          <span className={styles.customerName}>
                            {getCustomerDisplayName(customer)}
                          </span>
                          <span className={styles.customerEmail}>
                            {customer.contactEmail ?? '—'}
                          </span>
                        </div>
                      </a>
                    </td>
                    <td className={styles.td}>
                      {customer.company?.trim() ? customer.company : '—'}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.statusBadge}
                        data-active={customer.active}
                      >
                        {customer.active
                          ? t('status.active')
                          : t('status.inactive')}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {formatRegistrationDate(customer.metadataCreatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
