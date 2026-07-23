import React from 'react'
import { DetailSection } from '../shared/DetailSection'

interface OAuthDetailSectionProps {
  titleKey: string
  children: React.ReactNode
}

export const OAuthDetailSection: React.FC<OAuthDetailSectionProps> = ({
  titleKey,
  children,
}) => (
  <DetailSection
    titleKey={titleKey}
    titleClassName="oauth-detail-section-title"
    sectionClassName="oauth-detail-section"
  >
    {children}
  </DetailSection>
)
