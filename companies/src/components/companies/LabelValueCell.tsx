import type { ReactNode } from 'react'
import { StylableProps } from '../../helpers/props'
import styles from './LabelValueCell.module.scss'

interface Props extends StylableProps {
  readonly label: string
  readonly value: string | ReactNode
}

export const LabelValueCell = (props: Props) => {
  const { label, value, className = '', style } = props
  return (
    <div
      style={style}
      className={[styles.cell, className].filter(Boolean).join(' ')}
    >
      <div>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}
