import React from 'react'
import { DetailSection } from '../shared/DetailSection'

interface TokenDetailSectionProps {
  titleKey: string
  children: React.ReactNode
}

export const TokenDetailSection: React.FC<TokenDetailSectionProps> = ({
  titleKey,
  children,
}) => (
  <DetailSection
    titleKey={titleKey}
    titleClassName="token-detail-section-title"
    sectionClassName="token-detail-section"
  >
    {children}
  </DetailSection>
)
