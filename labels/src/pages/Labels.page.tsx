import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import LabelsTable from '../components/labels/LabelsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { labelAddPath } from '../constants/paths'
import styles from './LabelsPage.module.scss'

const LabelsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.LABELS_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('labels.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(labelAddPath())}
          >
            {t('labels.addLabel')}
          </PrimaryButton>
        }
      />
      <LabelsTable />
    </div>
  )
}

export default LabelsPage
