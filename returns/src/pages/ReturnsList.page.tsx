import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import ReturnsTable from '../components/returns/ReturnsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { returnAddPath } from '../constants/paths'
import styles from './ReturnsPage.module.scss'

const ReturnsListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.RETURNS_MANAGER)

  return (
    <>
      <HeaderSection
        title={t('returns.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(returnAddPath())}
          >
            {t('returns.createReturn')}
          </PrimaryButton>
        }
      />
      <ReturnsTable className={styles.table} />
    </>
  )
}

export default ReturnsListPage
