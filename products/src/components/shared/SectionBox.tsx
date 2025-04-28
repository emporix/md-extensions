import { ReactNode } from 'react'
import './SectionBox.scss'
import { textToTitleCase } from '../../helpers/utils'

interface SectionBoxProps {
  children: ReactNode
  className?: string
  name?: string
  theme?: 'green' | 'red'
}

const SectionBox = (props: SectionBoxProps) => {
  const { children, className, name, theme } = props

  return (
    <div className={`${className} section-box-wrapper`}>
      {name && <div className="section-box-title">{textToTitleCase(name)}</div>}
      <div
        data-test-id="section-box"
        className={`section-box ${theme && `section-box--${theme}`}`}
      >
        {children}
      </div>
    </div>
  )
}

SectionBox.defaultProps = {
  className: '',
}

export default SectionBox
