import { ReactNode } from 'react'
import { FiInfo } from 'react-icons/fi'
import { textToTitleCase } from '../../helpers/utils'
import styles from './InputField.module.scss'

type InputFieldProps = {
  readonly checkbox?: boolean
  readonly className?: string
  readonly label: string
  readonly children: ReactNode
  readonly required?: boolean
  readonly error?: string
  readonly htmlFor?: string
  readonly tooltip?: string
}

const InputField = ({
  className = '',
  error,
  label,
  children,
  checkbox = false,
  required = false,
  htmlFor,
  tooltip,
}: InputFieldProps) => {
  return (
    <div
      className={`${styles.field} ${className} ${
        checkbox ? styles.checkboxField : ''
      }`}
    >
      <label className={styles.label} htmlFor={htmlFor}>
        {textToTitleCase(label)}
        {required && <span className={styles.required}>*</span>}
        {tooltip && (
          <span
            className={styles.tooltipIcon}
            title={tooltip}
            aria-label={tooltip}
          >
            <FiInfo aria-hidden />
          </span>
        )}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

export default InputField
