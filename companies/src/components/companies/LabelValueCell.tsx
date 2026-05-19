import React from 'react'

export const LabelValueCell = (props: {
  label: string
  value: string
  className?: string
}) => {
  const { label, value, className } = props
  return (
    <div className={'contact-cell flex flex-column' + ` ${className}`}>
      <div className="label">{label}</div>
      <div className="value mt-2">{value}</div>
    </div>
  )
}
