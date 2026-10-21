import { Message } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import styles from './AiGeneratedNotice.module.scss'

type AiGeneratedNoticeProps = {
  readonly variant: 'long' | 'short'
  readonly placement?: 'detail' | 'dialog' | 'logs'
}

export const AiGeneratedNotice = ({
  variant,
  placement,
}: AiGeneratedNoticeProps) => {
  const { t } = useTranslation()
  const text =
    variant === 'long'
      ? t('ai_generated_notice_long')
      : t('ai_generated_notice_short')
  const placementClass = placement ? styles[placement] : undefined

  return (
    <Message
      severity="info"
      className={[styles.notice, placementClass].filter(Boolean).join(' ')}
      text={text}
    />
  )
}
