import React from 'react'

export interface DotIndicatorProps {
  value: boolean
  className?: string
  color?: string
}

const dotStyles = (value: boolean, color?: string) => {
  return {
    width: '12px',
    height: '12px',
    backgroundColor: value ? (color ? color : 'var(--green)') : 'var(--grey-4)',
  }
}

export const DotIndicator = (props: DotIndicatorProps) => {
  return (
    <div
      data-test-id="dot-indicator"
      className={`${props.className} border-round`}
      style={dotStyles(props.value, props.color)}
    ></div>
  )
}
