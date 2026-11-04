import styles from './ChangelogActorCell.module.scss'

type ChangelogActorCellProps = {
  readonly actor: string
}

const ACTOR_BADGE_CLASS: Record<string, string> = {
  system: styles.badgeSystem,
  external: styles.badgeExternal,
  unknown: styles.badgeUnknown,
}

const ChangelogActorCell = ({ actor }: ChangelogActorCellProps) => {
  const badgeClass = ACTOR_BADGE_CLASS[actor.toLowerCase()]

  if (badgeClass) {
    return (
      <span className={`${styles.actorBadge} ${badgeClass}`}>
        {actor.toUpperCase()}
      </span>
    )
  }

  return <span className={styles.actorName}>{actor}</span>
}

export default ChangelogActorCell
