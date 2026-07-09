import React from 'react'
import { StylableProps } from '../../helpers/props'
import styles from './FormGridRow.module.scss'

interface FormGridRowProps extends StylableProps {
  children: React.ReactNode | React.ReactNode[]
}

const FormGridRow = (props: FormGridRowProps) => {
  const { children, className = '' } = props

  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')}>
      <div className={styles.rowContent}>{children}</div>
    </div>
  )
}

export default FormGridRow
