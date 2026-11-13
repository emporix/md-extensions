import type { MouseEvent } from 'react'
import { Chip } from '@emporix/component-library'
import LabeledValue from '../shared/LabeledValue'
import { assignHostLocation } from '../../helpers/hostUrls'
import styles from './LinkChips.module.scss'

export type LinkChipItem = {
  readonly id: string
  readonly label: string
  /** Host route; opened with a full page navigation (leaves the remote). */
  readonly href: string
}

type LinkChipsProps = {
  readonly label: string
  readonly items: LinkChipItem[]
  readonly emptyText: string
  readonly className?: string
  readonly 'data-testid'?: string
}

/**
 * Read-only chips whose items open another screen (MD `Chips readOnly` with a
 * `Link` item template). The targets live in the host, outside this remote's
 * HashRouter, so the link is a real `href` (middle-click opens a tab) and a
 * plain click goes through `assignHostLocation`.
 */
const LinkChips = ({
  label,
  items,
  emptyText,
  className,
  'data-testid': testId,
}: LinkChipsProps) => {
  const open = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return
    event.preventDefault()
    assignHostLocation(href)
  }

  return (
    <LabeledValue label={label} className={className} data-testid={testId}>
      <div className={styles.chips}>
        {items.length === 0 ? (
          <span className={styles.empty}>{emptyText}</span>
        ) : (
          items.map((item) => (
            <Chip key={item.id}>
              <a
                className={styles.link}
                href={item.href}
                onClick={(event) => open(event, item.href)}
              >
                {item.label}
              </a>
            </Chip>
          ))
        )}
      </div>
    </LabeledValue>
  )
}

export default LinkChips
