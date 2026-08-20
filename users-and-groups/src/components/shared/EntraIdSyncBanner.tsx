import { Message } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { useEntraIdGroupsSync } from '../../hooks/useEntraIdGroupsSync'
import styles from './EntraIdSyncBanner.module.scss'

const EntraIdSyncBanner = () => {
  const { t } = useTranslation()
  const { isEntraIdGroupsSyncEnabled } = useEntraIdGroupsSync()

  if (!isEntraIdGroupsSyncEnabled) {
    return null
  }

  return (
    <Message
      className={styles.banner}
      severity="info"
      text={t('usersAndGroups.warnings.entraIdSyncEnabled')}
    />
  )
}

export default EntraIdSyncBanner
