import React from 'react'
import { DetailSection } from '../shared/DetailSection'

interface McpDetailSectionProps {
  titleKey: string
  children: React.ReactNode
}

export const McpDetailSection: React.FC<McpDetailSectionProps> = ({
  titleKey,
  children,
}) => (
  <DetailSection
    titleKey={titleKey}
    titleClassName="mcp-detail-section-title"
    sectionClassName="mcp-detail-section"
  >
    {children}
  </DetailSection>
)
