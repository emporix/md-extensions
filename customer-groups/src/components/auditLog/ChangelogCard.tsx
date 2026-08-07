import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ChangelogItem } from '../../models/Changelog.model'
import { getEntityDetailPath } from '../../configs/entityLinkConfig'
import {
  buildRelatedEntityBadgeLabel,
  filterMeaningfulChangelogPaths,
  getOtherRelatedItems,
} from '../../helpers/auditLog/entityChangelog.helpers'
import DateValue from '../shared/DateValue'
import ChangelogActorCell from './ChangelogActorCell'
import ChangelogChangeTypeBadge from './ChangelogChangeTypeBadge'
import ChangelogPathsTable from './ChangelogPathsTable'
import styles from './ChangelogCard.module.scss'

type ChangelogCardProps = {
  readonly item: ChangelogItem
  readonly iterationNumber: number
  readonly currentEntity: string
  readonly currentEntityId: string
}

const ChangelogCard = ({
  item,
  iterationNumber,
  currentEntity,
  currentEntityId,
}: ChangelogCardProps) => {
  const { t } = useTranslation()

  const getEntityTypeLabel = (entity: string) =>
    t(`auditLog.entities.${entity}`, { defaultValue: entity })

  const otherRelatedItem = getOtherRelatedItems(
    item.related,
    currentEntity,
    currentEntityId
  )[0]
  const hasRelated = !!otherRelatedItem
  const otherRelatedPath = otherRelatedItem
    ? getEntityDetailPath(otherRelatedItem.entity, otherRelatedItem.entityId)
    : undefined
  const badgeLabel = buildRelatedEntityBadgeLabel(
    getEntityTypeLabel(item.entity ?? 'unknown'),
    otherRelatedItem
      ? getEntityTypeLabel(otherRelatedItem.entity ?? 'unknown')
      : undefined
  )
  const meaningfulPaths = useMemo(
    () => filterMeaningfulChangelogPaths(item.paths ?? {}),
    [item.paths]
  )
  const showPathsTable =
    (item.type === 'create' || item.type === 'update') &&
    Object.keys(meaningfulPaths).length > 0

  const entityBadge = (
    <span className={styles.entityBadge}>{badgeLabel.toUpperCase()}</span>
  )

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.iteration}>#{iterationNumber}</span>
          <ChangelogActorCell actor={item.actor ?? ''} />
          <DateValue
            className={styles.timestamp}
            date={item.at}
            showTime={true}
            timeZone="UTC"
            hour12={false}
            nullText="--"
          />
        </div>
        <div className={styles.headerRight}>
          {hasRelated &&
            (otherRelatedPath ? (
              <Link
                className={styles.entityLink}
                to={otherRelatedPath}
                title={badgeLabel}
              >
                {entityBadge}
              </Link>
            ) : (
              entityBadge
            ))}
          <ChangelogChangeTypeBadge type={item.type} variant="card" />
        </div>
      </header>
      {showPathsTable && (
        <div className={styles.body}>
          <ChangelogPathsTable paths={meaningfulPaths} />
        </div>
      )}
    </article>
  )
}

export default ChangelogCard
