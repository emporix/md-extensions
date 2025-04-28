import { ReactNode } from 'react'

export interface Item {
  label: string
  value: string
  badge: ReactNode
}

export interface More {
  fn?: () => void
  label: string
}
