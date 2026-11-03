import type { ReactNode } from 'react'
import { BsBoxArrowRight } from 'react-icons/bs'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import styles from './LinkWithIcon.module.scss'

type LinkWithIconProps = {
  /** Hash-relative remote route. */
  readonly to?: string
  /**
   * Host-owned route (e.g. `/apps/management/carts/:id`). Leaves the remote
   * via `window.location.assign` — the remote's HashRouter cannot reach it.
   */
  readonly hostHref?: string
  readonly label?: string
  readonly onClick?: () => void
  readonly icon?: ReactNode
  readonly className?: string
}

const LinkWithIcon = ({
  to,
  hostHref,
  label = '',
  onClick,
  icon = <BsBoxArrowRight size={14} />,
  className = '',
}: LinkWithIconProps) => {
  const { navigate } = useCustomNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else if (hostHref) {
      window.location.assign(hostHref)
    } else {
      onClick?.()
    }
  }

  return (
    <button
      type="button"
      className={[styles.link, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        e.stopPropagation()
        handleClick()
      }}
    >
      {label}
      {icon}
    </button>
  )
}

export default LinkWithIcon
