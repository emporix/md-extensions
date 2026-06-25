import { BsArrowLeft } from 'react-icons/bs'
import styles from './BackButton.module.scss'

type BackButtonProps = {
  readonly onClick: () => void
  readonly className?: string
  readonly disabled?: boolean
  readonly ariaLabel?: string
}

const BackButton = ({
  onClick,
  className = '',
  disabled = false,
  ariaLabel = 'Back',
}: BackButtonProps) => {
  return (
    <button
      type="button"
      className={`${styles.backButton} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid="back-button"
    >
      <BsArrowLeft size={16} aria-hidden />
    </button>
  )
}

export default BackButton
