import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './MixinsSiteContextPanel.module.scss'

export type SiteContextOption = {
  readonly code: string
  readonly label: string
  readonly isDefault?: boolean
  readonly hasOverlay?: boolean
  readonly isDirty?: boolean
}

type MixinsSiteContextPanelProps = {
  readonly options: SiteContextOption[]
  readonly selectedCode: string
  readonly onSelect: (code: string) => void
  readonly disabled?: boolean
}

const MixinsSiteContextPanel = ({
  options,
  selectedCode,
  onSelect,
  disabled = false,
}: MixinsSiteContextPanelProps) => {
  const { t } = useTranslation()

  return (
    <nav
      className={styles.panel}
      aria-label={t('mixins.labels.siteContextPanel')}
    >
      <ul className={styles.list}>
        {options.map((option) => {
          const isSelected = option.code === selectedCode
          const classNames = [
            styles.item,
            option.isDefault ? styles.itemDefault : '',
            isSelected ? styles.itemSelected : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <React.Fragment key={option.code || 'default'}>
              <li>
                <button
                  type="button"
                  className={classNames}
                  aria-current={isSelected ? 'true' : undefined}
                  disabled={disabled}
                  onClick={() => onSelect(option.code)}
                >
                  <span className={styles.labelGroup}>
                    {option.isDirty ? (
                      <span
                        className={styles.dirtyMark}
                        title={t('mixins.labels.unsavedChanges')}
                        aria-label={t('mixins.labels.unsavedChanges')}
                      >
                        *
                      </span>
                    ) : null}
                    <span className={styles.label}>{option.label}</span>
                  </span>
                  {option.hasOverlay ? (
                    <span
                      className={styles.overlayDot}
                      title={t('mixins.labels.hasSiteOverlay')}
                      aria-label={t('mixins.labels.hasSiteOverlay')}
                      role="img"
                    />
                  ) : null}
                </button>
              </li>
              {option.isDefault ? <li className={styles.separator} /> : null}
            </React.Fragment>
          )
        })}
      </ul>
    </nav>
  )
}

export default MixinsSiteContextPanel
