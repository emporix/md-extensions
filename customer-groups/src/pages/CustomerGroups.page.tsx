import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import GroupsTable from '../components/customerGroups/GroupsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { GroupUserTypes } from '../models/Groups.model'
import { EmployeeDomains } from '../configs/accessControls'
import { groupAddPath } from '../constants/paths'
import styles from './CustomerGroupsPage.module.scss'

const CustomerGroupsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('usersAndGroups.titles.customerGroups')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(groupAddPath())}
          >
            {t('usersAndGroups.buttons.createGroup')}
          </PrimaryButton>
        }
      />
      <GroupsTable groupUserType={GroupUserTypes.CUSTOMER} />
    </div>
  )
}

export default CustomerGroupsPage
