import React from 'react'
import { StylableProps } from 'helpers/props'

interface Props extends StylableProps {
  version?: number
}

const BadgeTemplate = (props: Props) => {
  const { style, version } = props

  return (
    <div
      style={{
        ...style,
        fontSize: '0.75em',
        backgroundColor: '#f39c12',
        color: 'white',
        borderRadius: '2px',
        minWidth: '16px',
        width: 'fit-content',
        height: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
      }}
    >
      {version ? `v${version}` : '!'}
    </div>
  )
}

export default BadgeTemplate
