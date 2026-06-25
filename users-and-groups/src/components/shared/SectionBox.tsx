import { CSSProperties, ReactNode } from 'react'
import './SectionBox.scss'
import { textToTitleCase } from '../../helpers/utils'
import { StylableProps } from '../../helpers/props'

type SectionBoxProps = StylableProps & {
  readonly children: ReactNode
  readonly name?: string
  readonly actions?: ReactNode
  readonly sectionStyles?: CSSProperties
  readonly sectionClassName?: string
  readonly theme?: 'green' | 'red'
}

type SectionBoxTitleProps = StylableProps & {
  readonly name?: string
  readonly actions?: ReactNode
}

export const SectionTitle = ({
  className = '',
  name = '',
  actions,
}: SectionBoxTitleProps) => {
  return (
    <div className={`section-title-wrapper ${className}`}>
      <div className="section-title">{textToTitleCase(name)}</div>
      {actions && <div>{actions}</div>}
    </div>
  )
}

const SectionBox = ({
  children,
  name,
  actions,
  sectionStyles,
  className = '',
  sectionClassName = '',
  style,
  theme,
}: SectionBoxProps) => {
  return (
    <div style={style} className={`${className} section-box-wrapper`}>
      {(name ?? actions) && (
        <SectionTitle className="mb-3" name={name} actions={actions} />
      )}
      <div
        data-test-id="section-box"
        className={`section-box ${sectionClassName} ${theme ? `section-box--${theme}` : ''}`}
        style={sectionStyles}
      >
        {children}
      </div>
    </div>
  )
}

export default SectionBox
