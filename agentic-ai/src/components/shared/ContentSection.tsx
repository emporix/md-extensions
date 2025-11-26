import React, { ReactNode } from 'react'

interface ContentSectionProps {
  icon: string
  title: string
  content?: string
  children?: ReactNode
  headerAction?: ReactNode
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  icon,
  title,
  content,
  children,
  headerAction,
}) => {
  return (
    <div className="content-section">
      <div className="section-header">
        <i className={`pi ${icon} section-icon`} />
        <h3 className="section-title">{title}</h3>
        {headerAction && headerAction}
      </div>
      <div className="content-box">
        {content !== undefined ? (
          <pre className="content-text">{content}</pre>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default ContentSection
