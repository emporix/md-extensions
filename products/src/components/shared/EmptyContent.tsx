import { DataTableEmptyState, PrimaryButton } from '@emporix/component-library'
import { useNavigate } from 'react-router'
import styles from './EmptyContent.module.scss'

type EmptyContentProps = {
  readonly text: string
  readonly buttonLabel?: string
  readonly className?: string
  readonly link?: string
  readonly action?: () => void
  readonly managerPermissions?: boolean
  readonly showEmptyIcon?: boolean
}

const EmptyContent = ({
  className = '',
  text,
  buttonLabel,
  link,
  action,
  managerPermissions = true,
  showEmptyIcon = true,
}: EmptyContentProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (link) {
      void navigate(link)
      return
    }
    action?.()
  }

  return (
    <div className={[styles.emptyState, className].filter(Boolean).join(' ')}>
      <DataTableEmptyState message={text} showIcon={showEmptyIcon} />
      {buttonLabel ? (
        <PrimaryButton
          className={styles.actionLink}
          disabled={!managerPermissions}
          onClick={handleClick}
        >
          {buttonLabel}
        </PrimaryButton>
      ) : null}
    </div>
  )
}

export default EmptyContent
