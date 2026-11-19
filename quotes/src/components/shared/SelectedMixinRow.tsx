import { useMemo } from 'react'
import { InputSwitch } from '@emporix/component-library'
import { BsPencilFill } from 'react-icons/bs'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import type { DisplayMixin } from '../../models/DisplayMixin'
import styles from './SelectedMixinRow.module.scss'

interface SelectedMixinRowProps {
  readonly mixin: DisplayMixin
  readonly managerPermission?: boolean
  readonly onRemove: () => unknown
  readonly onEdit: () => unknown
}

export const SelectedMixinRow = ({
  mixin,
  managerPermission = true,
  onRemove,
  onEdit,
}: SelectedMixinRowProps) => {
  const { t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()
  const localLabel = useMemo(
    () => getUiLangValue(mixin.label),
    [mixin.label, getUiLangValue]
  )

  return (
    <div className={styles.row}>
      <div className={styles.header}>
        <InputSwitch
          inputId={mixin.key}
          checked
          disabled={!managerPermission}
          data-testid={`${mixin.key}-switch`}
          onChange={(e) => {
            if (!e.value) {
              onRemove()
            }
          }}
        />
        <label
          htmlFor={mixin.key}
          className={styles.label}
          data-testid={`${mixin.key}-label`}
        >
          {localLabel}
        </label>
        <button
          type="button"
          className={styles.editButton}
          disabled={!managerPermission}
          data-testid={`${mixin.key}-edit-button`}
          aria-label={t('global.edit')}
          onClick={() => onEdit()}
        >
          <BsPencilFill size={16} aria-hidden />
        </button>
      </div>
      <p className={styles.key}>{mixin.key}</p>
    </div>
  )
}

export default SelectedMixinRow
