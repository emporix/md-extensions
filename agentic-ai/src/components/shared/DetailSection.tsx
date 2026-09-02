import React from 'react'
import { useTranslation } from 'react-i18next'

type DetailSectionProps = {
  titleKey: string
  titleClassName: string
  sectionClassName: string
  children: React.ReactNode
  descriptionKey?: string
  descriptionClassName?: string
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  titleKey,
  titleClassName,
  sectionClassName,
  children,
  descriptionKey,
  descriptionClassName,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <h2 className={titleClassName}>{t(titleKey)}</h2>
      {descriptionKey ? (
        <p className={descriptionClassName}>{t(descriptionKey)}</p>
      ) : null}
      <section className={sectionClassName}>{children}</section>
    </>
  )
}
