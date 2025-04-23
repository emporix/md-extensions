import { FC } from 'react'
import classNames from 'classnames'
import './Badge.scss'

interface BadgeProps {
  value: string
  className?: string
}
const Badge: FC<BadgeProps> = ({ value, className }: BadgeProps) => {
  return <div className={classNames('badge', className)}>{value}</div>
}

export default Badge
