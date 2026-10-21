import type { ReactNode } from 'react'
import { FieldLabel } from '@emporix/component-library'
import styles from './LabeledValue.module.scss'

type LabeledValueProps = {
  readonly label: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  readonly 'data-testid'?: string
}

/**
 * Read-only label + value pair (MD `InputField` wrapping plain content).
 * CL `FieldLabel` is used because the child has no label API of its own.
 */
const LabeledValue = ({
  label,
  children,
  className = '',
  'data-testid': testId,
}: LabeledValueProps) => (
  <div
    className={[styles.field, className].filter(Boolean).join(' ')}
    data-testid={testId}
  >
    <FieldLabel className={styles.label}>{label}</FieldLabel>
    <div className={styles.value}>{children}</div>
  </div>
)

export default LabeledValue
