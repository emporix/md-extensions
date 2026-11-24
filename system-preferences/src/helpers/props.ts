import React, { ReactNode } from 'react'

export interface Props {
  children: ReactNode
}

export interface StylableProps {
  className?: string
  style?: React.CSSProperties
}
