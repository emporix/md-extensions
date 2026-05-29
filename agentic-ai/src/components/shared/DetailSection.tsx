import React from 'react'
import { useTranslation } from 'react-i18next'

type DetailSectionProps = {
  titleKey: string
  titleClassName: string
  sectionClassName: string
  children: React.ReactNode
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  titleKey,
  titleClassName,
  sectionClassName,
  children,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <h2 className={titleClassName}>{t(titleKey)}</h2>
      <section className={sectionClassName}>{children}</section>
    </>
  )
}
