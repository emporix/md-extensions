import { BsGlobe } from 'react-icons/bs'
import styles from './Mixins.module.scss'

interface MixinsLocalizedBadgeProps {
  readonly label: string
}

const MixinsLocalizedBadge = ({ label }: MixinsLocalizedBadgeProps) => (
  <span className={styles.localizedBadge}>
    <BsGlobe size={12} aria-hidden="true" />
    {label}
  </span>
)

export default MixinsLocalizedBadge
