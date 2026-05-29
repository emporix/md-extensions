import React from 'react'

type RequiredMarkProps = {
  className: string
}

export const RequiredMark: React.FC<RequiredMarkProps> = ({ className }) => (
  <span className={className}> *</span>
)
