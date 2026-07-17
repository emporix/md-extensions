import { useTranslation } from 'react-i18next'
import { getChangeTypeKey } from '../../helpers/auditLog/entityChangelog.helpers'
import styles from './ChangelogChangeTypeBadge.module.scss'

type ChangelogChangeTypeBadgeProps = {
  readonly type: string
  readonly variant?: 'table' | 'card'
}

const ChangelogChangeTypeBadge = ({
  type,
  variant = 'table',
}: ChangelogChangeTypeBadgeProps) => {
  const { t } = useTranslation()
  const changeTypeKey = getChangeTypeKey(type)
  const label = t(`auditLog.changeTypes.${changeTypeKey}`, {
    defaultValue: changeTypeKey,
  })

  return (
    <span
      className={`${styles.badge} ${
        variant === 'card' ? styles.badgeCard : styles.badgeTable
      }`}
    >
      {label.toUpperCase()}
    </span>
  )
}

export default ChangelogChangeTypeBadge
