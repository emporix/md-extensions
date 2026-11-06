import { ReactNode } from 'react'
import classNames from 'classnames'
import { RadioButton } from '@emporix/component-library'
import styles from './Coupons.module.scss'

interface Props {
  readonly inputId: string
  readonly name: string
  readonly title: string
  readonly description: string
  readonly checked: boolean
  readonly disabled: boolean
  readonly onSelect: () => void
  readonly children?: ReactNode
}

const CouponRestrictionOption = ({
  inputId,
  name,
  title,
  description,
  checked,
  disabled,
  onSelect,
  children,
}: Props) => {
  const optionClassName = classNames(styles.restrictionOption, {
    [styles.restrictionOptionWithBody]: !!children,
    [styles.restrictionOptionSelected]: checked,
    [styles.restrictionOptionDisabled]: disabled,
  })

  const radio = (
    <RadioButton
      disabled={disabled}
      inputId={inputId}
      name={name}
      value={inputId}
      onChange={onSelect}
      checked={checked}
    />
  )

  const copy = (
    <span className={styles.restrictionCopy}>
      <span className={styles.restrictionTitle}>{title}</span>
      <span className={styles.restrictionDescription}>{description}</span>
    </span>
  )

  if (!children) {
    return (
      <label htmlFor={inputId} className={optionClassName}>
        {radio}
        {copy}
      </label>
    )
  }

  return (
    <div className={optionClassName}>
      <label htmlFor={inputId} className={styles.restrictionHeader}>
        {radio}
        {copy}
      </label>
      {checked && <div className={styles.restrictionBody}>{children}</div>}
    </div>
  )
}

export default CouponRestrictionOption
