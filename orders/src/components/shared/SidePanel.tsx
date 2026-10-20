import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import { FiX } from 'react-icons/fi'

import styles from './SidePanel.module.scss'

/** Matches `slideIn` / `slideOut` duration in SidePanel.module.scss. */
const CLOSE_ANIMATION_MS = 300

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
 *
 * Stays mounted while `slideOut` plays so close is animated (PrimeReact
 * Sidebar leave transition). Unmounts after animation end or a timeout fallback.
 */
const SidePanel = ({
  visible,
  onHide,
  ariaLabel,
  children,
  'data-testid': dataTestId,
}: SidePanelProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onHideRef = useRef(onHide)
  onHideRef.current = onHide

  const [isRendered, setIsRendered] = useState(visible)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsRendered(true)
      setIsClosing(false)
      return
    }

    if (isRendered) {
      setIsClosing(true)
    }
  }, [visible, isRendered])

  useEffect(() => {
    if (!isClosing) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
      setIsClosing(false)
    }, CLOSE_ANIMATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isClosing])

  useEffect(() => {
    if (!visible) {
      return
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onHideRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [visible])

  const finishClose = () => {
    setIsRendered(false)
    setIsClosing(false)
  }

  const handlePanelAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || !isClosing) {
      return
    }
    finishClose()
  }

  if (!isRendered || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className={styles.root} data-testid={dataTestId}>
      <button
        type="button"
        className={classNames(styles.mask, {
          [styles.maskClosing]: isClosing,
        })}
        aria-label="Close"
        tabIndex={-1}
        onClick={isClosing ? undefined : onHide}
      />
      <aside
        className={classNames(styles.panel, {
          [styles.panelClosing]: isClosing,
        })}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <div className={styles.header}>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            onClick={isClosing ? undefined : onHide}
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
