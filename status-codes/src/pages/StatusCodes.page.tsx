import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import StatusCodesTable from '../components/statusCodes/StatusCodesTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { statusCodeAddPath } from '../constants/paths'
import styles from './StatusCodesPage.module.scss'

const StatusCodesPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.STATUS_CODES_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('quotesReasons.title')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(statusCodeAddPath())}
            data-testid="status-codes-create"
          >
            {t('quotesReasons.createButton')}
          </PrimaryButton>
        }
      />
      <StatusCodesTable />
    </div>
  )
}

export default StatusCodesPage
