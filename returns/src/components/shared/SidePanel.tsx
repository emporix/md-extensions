import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

import styles from './SidePanel.module.scss'

type SidePanelProps = {
  readonly visible: boolean
  readonly onHide: () => void
  /** Accessible name only — MD Sidebar has no visible title, just the close icon. */
  readonly ariaLabel: string
  readonly children: ReactNode
  readonly 'data-testid'?: string
}

/**
 * Right-side drawer matching MD PrimeReact `Sidebar` (`position="right"`,
 * default width `20rem`, close-only header). CL has no Sidebar export yet.
 */
const SidePanel = ({
  visible,
  onHide,
  ariaLabel,
  children,
  'data-testid': dataTestId,
}: SidePanelProps) => {
  useEffect(() => {
    if (!visible) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onHide()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [visible, onHide])

  if (!visible || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className={styles.root} data-testid={dataTestId}>
      <button
        type="button"
        className={styles.mask}
        aria-label="Close"
        tabIndex={-1}
        onClick={onHide}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.close}
            onClick={onHide}
            aria-label="Close"
            data-testid="side-panel-close"
          >
            <FiX size={22} aria-hidden />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>,
    document.body
  )
}

export default SidePanel
