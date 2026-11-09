import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import UnitsTable from '../components/units/UnitsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { unitAddPath } from '../constants/paths'
import styles from './UnitsPage.module.scss'

const UnitsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.UNITS_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('units.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(unitAddPath())}
            data-testid="units-create"
          >
            {t('units.titleAdd')}
          </PrimaryButton>
        }
      />
      <UnitsTable />
    </div>
  )
}

export default UnitsPage
