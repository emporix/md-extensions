import { KeyboardEvent, useRef } from 'react'
import classNames from 'classnames'
import { useConfiguration } from '../../context/ConfigurationProvider'
import styles from './Mixins.module.scss'

interface MixinsLanguageTabsProps {
  /** Prefix for the tab and panel ids (`useId()` of the owner). */
  readonly idPrefix: string
  readonly languageIds: readonly string[]
  readonly activeLanguage: string
  readonly onChange: (languageId: string) => void
  readonly ariaLabel: string
}

export const languageTabId = (idPrefix: string, languageId: string): string =>
  `${idPrefix}-tab-${languageId}`

export const languagePanelId = (idPrefix: string): string => `${idPrefix}-panel`

const targetIndex = (
  key: string,
  index: number,
  count: number
): number | undefined => {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count
    case 'ArrowLeft':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return undefined
  }
}

/** One tab per language code; the owner renders the panel for the active one. */
const MixinsLanguageTabs = ({
  idPrefix,
  languageIds,
  activeLanguage,
  onChange,
  ariaLabel,
}: MixinsLanguageTabsProps) => {
  const { languages } = useConfiguration()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const next = targetIndex(event.key, index, languageIds.length)
    if (next === undefined) {
      return
    }
    event.preventDefault()
    const languageId = languageIds[next]
    onChange(languageId)
    tabRefs.current[languageId]?.focus()
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={styles.languageTabs}>
      {languageIds.map((languageId, index) => {
        const isActive = languageId === activeLanguage
        return (
          <button
            key={languageId}
            ref={(element) => {
              tabRefs.current[languageId] = element
            }}
            id={languageTabId(idPrefix, languageId)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={languagePanelId(idPrefix)}
            tabIndex={isActive ? 0 : -1}
            title={
              languages?.find((language) => language.id === languageId)?.label
            }
            className={classNames(styles.languageTab, {
              [styles.languageTabActive]: isActive,
            })}
            onClick={() => onChange(languageId)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {languageId.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}

export default MixinsLanguageTabs
