import React from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'primereact/tooltip'

interface DetailStatusDotProps {
  enabled: boolean
}

export const DetailStatusDot: React.FC<DetailStatusDotProps> = ({
  enabled,
}) => {
  const { t } = useTranslation()
  const label = enabled ? t('enabled') : t('disabled')

  return (
    <>
      <span
        className={`detail-status-dot${
          enabled
            ? ' detail-status-dot--enabled'
            : ' detail-status-dot--disabled'
        }`}
        role="img"
        aria-label={label}
        data-pr-tooltip={label}
        data-pr-position="top"
      />
      <Tooltip target=".detail-status-dot" />
    </>
  )
}
