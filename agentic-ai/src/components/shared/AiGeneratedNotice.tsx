import { useTranslation } from 'react-i18next'
import { Message } from 'primereact/message'

type AiGeneratedNoticeProps = {
  readonly variant: 'long' | 'short'
}

export const AiGeneratedNotice = ({ variant }: AiGeneratedNoticeProps) => {
  const { t } = useTranslation()
  const text =
    variant === 'long'
      ? t('ai_generated_notice_long')
      : t('ai_generated_notice_short')

  return <Message severity="info" className="ai-generated-notice" text={text} />
}
