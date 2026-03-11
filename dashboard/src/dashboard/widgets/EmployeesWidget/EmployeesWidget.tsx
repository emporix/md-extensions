import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { useEmployees } from '../../hooks/useEmployees'
import {
  getEmployeeInitials,
  getEmployeeAvatarColor,
  getEmployeeDisplayName,
  formatDate,
} from '../../helpers/employee.helpers'
import styles from './EmployeesWidget.module.scss'

const SEE_ALL_USERS_LINK = '/administration/users-and-groups'

const getStatusLabel = (
  status: string | undefined,
  isAccountLocked: boolean | undefined,
  t: (key: string) => string
): string => {
  if (status === 'ACTIVE' && !isAccountLocked) return t('status.active')
  if (isAccountLocked) return t('status.locked')
  return status ?? t('status.inactive')
}

export const EmployeesWidget = () => {
  const { appState } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const { employees, total, loading, error } = useEmployees(
    appState?.tenant,
    appState?.token
  )

  const displayTotal = total ?? employees.length
  const showTable = !loading && !error && appState?.tenant

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {t('employees.title', { count: displayTotal })}
        </h3>
        <a href={SEE_ALL_USERS_LINK} className={styles.seeAllLink}>
          {t('employees.seeAll')}
        </a>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <span>{t('employees.loading')}</span>
        </div>
      )}

      {error && (
        <div className={styles.placeholder} role="alert">
          <span>{t(error)}</span>
        </div>
      )}

      {!appState?.tenant && !loading && !error && (
        <div className={styles.placeholder}>
          <span>{t('employees.signInToView')}</span>
        </div>
      )}

      {showTable && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              {t('employees.caption')}
            </caption>
            <thead>
              <tr>
                <th className={styles.th} scope="col">
                  {t('table.user')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.memberSince')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.status')}
                </th>
                <th className={styles.th} scope="col">
                  {t('table.lastLogin')}
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    {t('employees.noResults')}
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className={styles.row}>
                    <td className={styles.td}>
                      <a
                        href={`/administration/users-and-groups/users/${employee.id}`}
                        className={`${styles.userCell} ${styles.userLink}`}
                      >
                        <span
                          className={styles.avatar}
                          style={{
                            backgroundColor: getEmployeeAvatarColor(employee),
                          }}
                          aria-hidden
                        >
                          {getEmployeeInitials(employee)}
                        </span>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {getEmployeeDisplayName(employee)}
                          </span>
                          <span className={styles.userEmail}>
                            {employee.contactEmail ?? '—'}
                          </span>
                        </div>
                      </a>
                    </td>
                    <td className={styles.td}>
                      {formatDate(employee.validFrom)}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.statusBadge}
                        data-active={
                          employee.status === 'ACTIVE' &&
                          !employee.isAccountLocked
                        }
                      >
                        {getStatusLabel(
                          employee.status,
                          employee.isAccountLocked,
                          t
                        )}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {formatDate(employee.lastLogin)}
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
