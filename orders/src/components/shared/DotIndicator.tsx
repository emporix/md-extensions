import styles from './DotIndicator.module.scss'

type DotIndicatorProps = {
  readonly value: boolean
  /** Colour when `value` is true (MD default: green). */
  readonly color?: string
  readonly className?: string
}

export const DotIndicator = ({
  value,
  color,
  className = '',
}: DotIndicatorProps) => (
  <div
    data-testid="dot-indicator"
    className={[styles.dot, value ? styles.on : '', className]
      .filter(Boolean)
      .join(' ')}
    style={value && color ? { backgroundColor: color } : undefined}
  />
)

export default DotIndicator
