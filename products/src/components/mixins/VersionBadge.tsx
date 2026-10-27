import styles from './Mixins.module.scss'

interface Props {
  readonly version?: number
  readonly className?: string
}

const BadgeTemplate = ({ version, className = '' }: Props) => (
  <div className={`${styles.versionBadge} ${className}`}>
    {version ? `v${version}` : '!'}
  </div>
)

export default BadgeTemplate
