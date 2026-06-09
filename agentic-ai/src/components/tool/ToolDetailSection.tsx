import React from 'react'
import { DetailSection } from '../shared/DetailSection'

interface ToolDetailSectionProps {
  titleKey: string
  children: React.ReactNode
}

export const ToolDetailSection: React.FC<ToolDetailSectionProps> = ({
  titleKey,
  children,
}) => (
  <DetailSection
    titleKey={titleKey}
    titleClassName="tool-detail-section-title"
    sectionClassName="tool-detail-section"
  >
    {children}
  </DetailSection>
)
