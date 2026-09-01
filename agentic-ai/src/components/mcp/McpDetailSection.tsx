import React from 'react'
import { DetailSection } from '../shared/DetailSection'

interface McpDetailSectionProps {
  titleKey: string
  children: React.ReactNode
  plain?: boolean
}

export const McpDetailSection: React.FC<McpDetailSectionProps> = ({
  titleKey,
  children,
  plain = false,
}) => (
  <DetailSection
    titleKey={titleKey}
    titleClassName="mcp-detail-section-title"
    sectionClassName={
      plain ? 'mcp-detail-section mcp-detail-section--plain' : 'mcp-detail-section'
    }
  >
    {children}
  </DetailSection>
)
