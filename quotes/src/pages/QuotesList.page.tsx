import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import SitesSelect from '../components/shared/SitesSelect'
import QuotesTable from '../components/quotes/QuotesTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { quoteAddPath } from '../constants/paths'
import styles from './Quotes.page.module.scss'

/** MD `QuotesListPage`: header with the site select and the quotes table. */
const QuotesListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)

  return (
    <>
      <HeaderSection
        title={t('quotes.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(quoteAddPath())}
            data-testid="quotes-create"
          >
            {t('quotes.createButton')}
          </PrimaryButton>
        }
      >
        <div className={styles.siteSelect}>
          <SitesSelect />
        </div>
      </HeaderSection>
      <QuotesTable className={styles.fullWidth} />
    </>
  )
}

export default QuotesListPage
