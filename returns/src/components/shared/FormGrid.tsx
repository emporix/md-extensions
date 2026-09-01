import React from 'react'
import { StylableProps } from '../../helpers/props'
import styles from './FormGrid.module.scss'

interface FormGridProps extends StylableProps {
  children: React.ReactNode | React.ReactNode[]
}

const FormGrid = (props: FormGridProps) => {
  const { children, className = '' } = props

  return (
    <form className={[styles.form, className].filter(Boolean).join(' ')}>
      {children}
    </form>
  )
}

export default FormGrid
