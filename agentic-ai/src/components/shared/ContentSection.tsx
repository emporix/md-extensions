import React, { ReactNode } from 'react'
import {
  CollapsibleText,
  CollapsibleTextToggle,
  useCollapsibleText,
} from './CollapsibleText'

interface ContentSectionProps {
  icon: string
  title: string
  content?: string
  children?: ReactNode
  headerAction?: ReactNode
  maxLines?: number
  plain?: boolean
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  icon,
  title,
  content,
  children,
  headerAction,
  maxLines,
  plain = false,
}) => {
  const isCollapsible = content !== undefined && maxLines !== undefined
  const collapsible = useCollapsibleText(content ?? '', maxLines ?? 2)
  const canToggle = isCollapsible && collapsible.showToggle

  const handleContentClick = () => {
    if (canToggle) {
      collapsible.toggle()
    }
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <i className={`pi ${icon} section-icon`} />
        <h3 className="panel-section-title">{title}</h3>
        {(headerAction || isCollapsible) && (
          <div className="section-header-actions">
            {headerAction}
            {isCollapsible && (
              <CollapsibleTextToggle
                isExpanded={collapsible.isExpanded}
                onToggle={collapsible.toggle}
                visible={collapsible.showToggle}
              />
            )}
          </div>
        )}
      </div>
      <div
        className={`content-box${plain ? ' content-box--plain' : ''}${canToggle ? ' content-box--collapsible' : ''}`}
        onClick={handleContentClick}
      >
        {content !== undefined ? (
          isCollapsible ? (
            <CollapsibleText
              as="pre"
              content={content}
              className="content-text"
              isExpanded={collapsible.isExpanded}
              textRef={collapsible.textRef}
              collapsedStyle={collapsible.collapsedStyle}
            />
          ) : (
            <pre className="content-text">{content}</pre>
          )
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default ContentSection
