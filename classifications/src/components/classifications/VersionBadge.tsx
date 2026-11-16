import styles from './VersionBadge.module.scss'

type VersionBadgeProps = {
  readonly version?: number
  readonly className?: string
  readonly 'data-testid'?: string
}

/** `vN` for a newer schema version, `!` without one (MD `VersionBadge`). */
const VersionBadge = ({
  version,
  className = '',
  'data-testid': testId,
}: VersionBadgeProps) => (
  <div
    className={[styles.versionBadge, className].filter(Boolean).join(' ')}
    data-testid={testId}
  >
    {version ? `v${version}` : '!'}
  </div>
)

export default VersionBadge
