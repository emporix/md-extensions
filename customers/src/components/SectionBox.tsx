import React, { CSSProperties, ReactNode } from 'react'
import './SectionBox.scss'
import { textToTitleCase } from '../helpers/utils'
import { StylableProps } from '../helpers/props'

interface Props extends StylableProps {
  children: ReactNode
  name?: string
  actions?: ReactNode
  sectionStyles?: CSSProperties
  sectionClassName?: string
}

interface SectionBoxTitleProps extends StylableProps {
  name?: string
  actions?: ReactNode
}

export const SectionTitle = (props: SectionBoxTitleProps) => {
  const { className = '', name = '', actions } = props

  return (
    <div className={`section-title-wrapper ${className}`}>
      <div className="section-title">{textToTitleCase(name)}</div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

const SectionBox = (props: Props) => {
  const {
    children,
    name,
    actions,
    sectionStyles,
    className = '',
    sectionClassName = '',
    style,
  } = props

  return (
    <div style={style} className={`${className} section-box-wrapper`}>
      {(name || actions) && (
        <SectionTitle className="mb-3" name={name} actions={actions} />
      )}
      <div
        data-test-id="section-box"
        className={`section-box ${sectionClassName}`}
        style={sectionStyles}
      >
        {children}
      </div>
    </div>
  )
}

export default SectionBox
