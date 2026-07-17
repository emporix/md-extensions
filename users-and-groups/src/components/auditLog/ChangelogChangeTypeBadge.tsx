import { useTranslation } from 'react-i18next'
import { getChangeTypeKey } from '../../helpers/auditLog/entityChangelog.helpers'
import styles from './ChangelogChangeTypeBadge.module.scss'

type ChangelogChangeTypeBadgeProps = {
  readonly type: string
  readonly variant?: 'table' | 'card'
}

const CARD_TYPE_CLASS: Record<string, string> = {
  created: styles.badgeCardCreated,
  updated: styles.badgeCardUpdated,
  deleted: styles.badgeCardDeleted,
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

  const className =
    variant === 'card'
      ? [
          styles.badge,
          styles.badgeCard,
          CARD_TYPE_CLASS[changeTypeKey],
        ]
          .filter(Boolean)
          .join(' ')
      : `${styles.badge} ${styles.badgeTable}`

  return <span className={className}>{label.toUpperCase()}</span>
}

export default ChangelogChangeTypeBadge
