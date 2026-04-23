import React from 'react'
import { StylableProps } from '../helpers/props'

interface FormGridRowProps extends StylableProps {
  children: React.ReactNode | React.ReactNode[]
}

const FormGridRow = (props: FormGridRowProps) => {
  const { children, className = '' } = props

  return (
    <div className={`${className} col-12`}>
      <div className="grid">{children}</div>
    </div>
  )
}

export default FormGridRow
