import { ReactNode } from 'react'
import { SecondaryButton } from '@emporix/component-library'
import { BsPlusLg } from 'react-icons/bs'
import { HiMinus } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { textToTitleCase } from '../../helpers/utils'
import { MixinsFormItem } from './helpers'
import MixinsFormItemChangeIndicator from './MixinsFormItemChangeIndicator'
import { getIndicatorClassName } from './mixinsIndicator'
import styles from './MixinsSectionBox.module.scss'

interface MixinsSectionBoxProps {
  readonly item?: MixinsFormItem
  readonly children: ReactNode
  readonly className?: string
  readonly name: string
  readonly append?: () => void
  readonly remove?: () => void
}

const MixinsSectionBox = ({
  item,
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
        <div className={styles.title}>
          <MixinsFormItemChangeIndicator item={item} />
          <span className={getIndicatorClassName(item)}>
            {textToTitleCase(name)}
          </span>
        </div>
        <div className={styles.actions}>
          {remove && (
            <SecondaryButton
              size="small"
              iconOnly
              aria-label={t('global.remove')}
              onClick={remove}
            >
              <HiMinus size={16} />
            </SecondaryButton>
          )}
          {append && (
            <SecondaryButton
              className={styles.addButton}
              size="small"
              onClick={append}
            >
              <BsPlusLg size={16} />
              <span className={styles.addLabel}>
                {t('mixins.buttons.addNew')}
              </span>
            </SecondaryButton>
          )}
        </div>
      </div>
      <div data-testid="section-box" className={styles.body}>
        {children}
      </div>
    </div>
  )
}

export default MixinsSectionBox
