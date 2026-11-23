import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import TaxesTable from '../components/taxes/TaxesTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { taxClassAddPath } from '../constants/paths'
import styles from './TaxesPage.module.scss'

const TaxesPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.TAXES_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('taxes.title')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(taxClassAddPath())}
            data-testid="taxes-create"
          >
            {t('taxes.addTaxClass')}
          </PrimaryButton>
        }
      />
      <TaxesTable />
    </div>
  )
}

export default TaxesPage
