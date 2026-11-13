import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import CatalogsTable from '../components/catalogs/CatalogsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { catalogAddPath } from '../constants/paths'
import styles from './CatalogsPage.module.scss'

const CatalogsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATALOGS_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('catalogs.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(catalogAddPath())}
            data-testid="catalogs-create"
          >
            {t('catalogs.addNewCatalog')}
          </PrimaryButton>
        }
      />
      <CatalogsTable />
    </div>
  )
}

export default CatalogsPage
