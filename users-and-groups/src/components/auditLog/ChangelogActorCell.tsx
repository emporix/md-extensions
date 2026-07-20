import styles from './ChangelogActorCell.module.scss'

type ChangelogActorCellProps = {
  readonly actor: string
}

const ChangelogActorCell = ({ actor }: ChangelogActorCellProps) => {
  if (actor.toLowerCase() === 'system') {
    return <span className={styles.systemBadge}>{actor.toUpperCase()}</span>
  }

  return <span className={styles.actorName}>{actor}</span>
}

export default ChangelogActorCell
