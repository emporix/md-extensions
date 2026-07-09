import { PrimaryButton } from '@emporix/component-library'
import { Link } from 'react-router'
import styles from './EmptyContent.module.scss'

type EmptyContentProps = {
  readonly text: string
  readonly buttonLabel?: string
  readonly className?: string
  readonly link?: string
  readonly action?: () => void
  readonly managerPermissions?: boolean
}

const EmptyContent = ({
  className = '',
  text,
  buttonLabel,
  link,
  action,
  managerPermissions = true,
}: EmptyContentProps) => {
  return (
    <div className={[styles.emptyState, className].filter(Boolean).join(' ')}>
      <p className={styles.message}>{text}</p>
      {buttonLabel && (
        <Link to={link ?? ''} className={styles.actionLink}>
          <PrimaryButton disabled={!managerPermissions} onClick={action}>
            {buttonLabel}
          </PrimaryButton>
        </Link>
      )}
    </div>
  )
}

export default EmptyContent
