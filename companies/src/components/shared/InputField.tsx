import type { CSSProperties, ReactNode } from 'react'
import { FieldLabel } from '@emporix/component-library'
import { textToTitleCase } from '../../helpers/utils'
import styles from './InputField.module.scss'

type InputFieldProps = {
  readonly label: string | ReactNode
  readonly name?: string
  readonly children?: ReactNode
  readonly required?: boolean
  readonly error?: string
  readonly tooltip?: string
  readonly checkbox?: boolean
  readonly addon?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Form field wrapper (MD `components/InputField`): CL `FieldLabel`, an
 * optional addon and the error message. The products remote's copy also shows
 * the variant "Inherited from parent" hint, which never applies to orders. Use
 * CL built-in `label` props instead when the control has one.
 */
const InputField = ({
  label,
  name,
  children,
  required = false,
  error,
  tooltip,
  checkbox = false,
  addon,
  className = '',
  style,
}: InputFieldProps) => (
  <div
    style={style}
    className={[styles.field, checkbox ? styles.checkbox : '', className]
      .filter(Boolean)
      .join(' ')}
  >
    <div className={styles.labelRow}>
      <FieldLabel htmlFor={name} required={required} tooltip={tooltip}>
        {typeof label === 'string' ? textToTitleCase(label) : label}
      </FieldLabel>
      {addon && <div className={styles.addon}>{addon}</div>}
    </div>
    <div className={error ? styles.invalid : undefined}>{children}</div>
    {error && <small className={styles.error}>{error}</small>}
  </div>
)

export default InputField
