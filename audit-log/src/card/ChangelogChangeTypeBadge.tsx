import type { ChangelogEntryType } from '@emporix/api-calls/next'
import type { ChangelogChangeTypeKey, EntityChangelogLabels } from '../labels'
import { CHANGE_TYPE_KEY } from './changelogEntry'
import styles from './ChangelogChangeTypeBadge.module.scss'

type ChangelogChangeTypeBadgeProps = {
  readonly type: ChangelogEntryType
  readonly variant?: 'table' | 'card'
  readonly labels: Pick<EntityChangelogLabels, 'changeType'>
}

const CARD_TYPE_CLASS: Record<ChangelogChangeTypeKey, string> = {
  created: styles.badgeCardCreated,
  updated: styles.badgeCardUpdated,
  deleted: styles.badgeCardDeleted,
}

const ChangelogChangeTypeBadge = ({
  type,
  variant = 'table',
  labels,
}: ChangelogChangeTypeBadgeProps) => {
  // The API can send a type this version does not know; it shows as it came
  const changeTypeKey: ChangelogChangeTypeKey | undefined =
    Object.prototype.hasOwnProperty.call(CHANGE_TYPE_KEY, type)
      ? CHANGE_TYPE_KEY[type]
      : undefined
  const label = changeTypeKey ? labels.changeType(changeTypeKey) : type

  const className =
    variant === 'card'
      ? [
          styles.badge,
          styles.badgeCard,
          changeTypeKey && CARD_TYPE_CLASS[changeTypeKey],
        ]
          .filter(Boolean)
          .join(' ')
      : `${styles.badge} ${styles.badgeTable}`

  return <span className={className}>{label.toUpperCase()}</span>
}

export default ChangelogChangeTypeBadge
