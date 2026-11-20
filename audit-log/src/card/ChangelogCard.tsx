import { useMemo } from 'react'
import { DateValue } from '@emporix/component-library'
import type { ChangelogEntry } from '@emporix/api-calls/next'
import type { EntityChangelogLabels } from '../labels'
import type { EntityChangelogLinks } from '../EntityChangelog'
import {
  buildRelatedEntityBadgeLabel,
  filterMeaningfulChangelogPaths,
  getOtherRelatedItems,
} from './changelogEntry'
import ChangelogActorCell from './ChangelogActorCell'
import ChangelogChangeTypeBadge from './ChangelogChangeTypeBadge'
import ChangelogPathsTable from './ChangelogPathsTable'
import styles from './ChangelogCard.module.scss'

type ChangelogCardProps = {
  readonly item: ChangelogEntry
  readonly currentEntity: string
  readonly currentEntityId: string
  readonly labels: Pick<
    EntityChangelogLabels,
    | 'entity'
    | 'changeType'
    | 'notSet'
    | 'fieldColumn'
    | 'previousValueColumn'
    | 'updatedValueColumn'
  >
  readonly locale: string
  readonly entityLinks?: EntityChangelogLinks
}

const ChangelogCard = ({
  item,
  currentEntity,
  currentEntityId,
  labels,
  locale,
  entityLinks,
}: ChangelogCardProps) => {
  const otherRelatedItem = getOtherRelatedItems(
    item.related,
    currentEntity,
    currentEntityId
  )[0]
  const hasRelated = !!otherRelatedItem
  const otherRelatedPath = otherRelatedItem
    ? entityLinks?.pathOf(otherRelatedItem.entity, otherRelatedItem.entityId)
    : undefined
  const badgeLabel = buildRelatedEntityBadgeLabel(
    labels.entity(item.entity ?? 'unknown'),
    otherRelatedItem
      ? labels.entity(otherRelatedItem.entity ?? 'unknown')
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
          <ChangelogActorCell actor={item.actor ?? ''} />
          <DateValue
            className={styles.timestamp}
            date={item.at}
            locale={locale}
            showTime={true}
            hour12={false}
            nullText="--"
          />
        </div>
        <div className={styles.headerRight}>
          {hasRelated &&
            (entityLinks && otherRelatedPath
              ? entityLinks.render({
                  to: otherRelatedPath,
                  className: styles.entityLink,
                  title: badgeLabel,
                  children: entityBadge,
                })
              : entityBadge)}
          <ChangelogChangeTypeBadge
            type={item.type}
            variant="card"
            labels={labels}
          />
        </div>
      </header>
      {showPathsTable && (
        <div className={styles.body}>
          <ChangelogPathsTable paths={meaningfulPaths} labels={labels} />
        </div>
      )}
    </article>
  )
}

export default ChangelogCard
