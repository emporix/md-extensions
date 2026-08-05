import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import BrandsTable from '../components/brands/BrandsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { brandAddPath } from '../constants/paths'
import styles from './BrandsPage.module.scss'

const BrandsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.BRANDS_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('brands.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(brandAddPath())}
          >
            {t('brands.addBrand')}
          </PrimaryButton>
        }
      />
      <BrandsTable />
    </div>
  )
}

export default BrandsPage
