import { ReactNode } from 'react'
import { SecondaryButton } from '@emporix/component-library'
import { BsPlusLg } from 'react-icons/bs'
import { HiMinus } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { textToTitleCase } from '../../helpers/utils'
import styles from './MixinsSectionBox.module.scss'

interface MixinsSectionBoxProps {
  children: ReactNode
  className?: string
  name: string
  append?: () => void
  remove?: () => void
}

const MixinsSectionBox = ({
  children,
  className = '',
  name,
  append,
  remove,
}: MixinsSectionBoxProps) => {
  const { t } = useTranslation()

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <div
          className={[styles.title, remove ? styles.titleFull : '']
            .filter(Boolean)
            .join(' ')}
        >
          {textToTitleCase(name)}
          {remove && (
            <SecondaryButton className={styles.removeButton} onClick={remove}>
              <HiMinus size={16} />
            </SecondaryButton>
          )}
        </div>
        {append && (
          <SecondaryButton onClick={append}>
            <BsPlusLg size={16} />
            <span className={styles.addLabel}>{t('global.mixins.addNew')}</span>
          </SecondaryButton>
        )}
      </div>
      <div data-testid="section-box" className={styles.body}>
        {children}
      </div>
    </div>
  )
}

export default MixinsSectionBox
