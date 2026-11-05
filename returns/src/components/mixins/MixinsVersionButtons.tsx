import { PrimaryButton, SecondaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import MixinsTechnicalDialog from './MixinsTechnicalDialog'
import styles from './Mixins.module.scss'

interface Props {
  readonly activeFormIndex: number
  readonly onSelect: (index: number) => void
  readonly onShowTechnical: () => void
  readonly onHideTechnical: () => void
  readonly showTechnical: boolean
  readonly presentSchemaUrl?: string
  readonly newerSchemaUrl?: string
  readonly disabled?: boolean
  /** MD `mt-3` (accordion) vs `mb-3` (tab form) placement. */
  readonly placement?: 'top' | 'bottom'
}

/**
 * MD "Keep old / New version / Technical" toolbar shown when a schema has a
 * newer version. The active version renders as the primary button, the other
 * as secondary (MD toggled `p-button-secondary`).
 */
const MixinsVersionButtons = ({
  activeFormIndex,
  onSelect,
  onShowTechnical,
  onHideTechnical,
  showTechnical,
  presentSchemaUrl,
  newerSchemaUrl,
  disabled = false,
  placement = 'bottom',
}: Props) => {
  const { t } = useTranslation()
  const renderVersionButton = (index: number, label: string) =>
    activeFormIndex === index ? (
      <PrimaryButton onClick={() => onSelect(index)} disabled={disabled}>
        {label}
      </PrimaryButton>
    ) : (
      <SecondaryButton onClick={() => onSelect(index)} disabled={disabled}>
        {label}
      </SecondaryButton>
    )

  return (
    <div className={placement === 'top' ? styles.toolbarTop : styles.toolbar}>
      {renderVersionButton(0, t('mixins.buttons.keepOld'))}
      {renderVersionButton(1, t('mixins.buttons.newVersion'))}
      <SecondaryButton onClick={onShowTechnical} disabled={disabled}>
        {t('mixins.buttons.technical')}
      </SecondaryButton>
      <MixinsTechnicalDialog
        show={showTechnical}
        onHide={onHideTechnical}
        newerSchemaUrl={newerSchemaUrl}
        presentSchemaUrl={presentSchemaUrl}
      />
    </div>
  )
}

export default MixinsVersionButtons
