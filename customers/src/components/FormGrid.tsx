import React from 'react'
import { StylableProps } from '../helpers/props'

interface FormGridProps extends StylableProps {
  children: React.ReactNode | React.ReactNode[]
}

const FormGrid = (props: FormGridProps) => {
  const { children, className = '' } = props

  return (
    <form className={`${className} grid`} style={{ maxWidth: '800px' }}>
      {children}
    </form>
  )
}

export default FormGrid
