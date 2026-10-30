import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../contexts/ToastContext'

type ChatSourceBlockProps = {
  readonly title?: string
  readonly copyText: string
  readonly children: ReactNode
}

export const ChatSourceBlock = ({
  title,
  copyText,
  children,
}: ChatSourceBlockProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()

  const handleCopy = async () => {
    if (copyText === '') {
      return
    }

    try {
      await navigator.clipboard.writeText(copyText)
      showSuccess(t('copied_to_clipboard'))
    } catch (error) {
      console.error('Failed to copy source', error)
      showError(t('failed_to_copy'))
    }
  }

  const copyButton =
    copyText === '' ? null : (
      <button
        type="button"
        className={`communication-panel-copy chat-source-copy${
          title ? '' : ' chat-source-copy-floating'
        }`}
        aria-label={t('copy')}
        title={t('copy')}
        onClick={() => {
          void handleCopy()
        }}
      >
        <i className="pi pi-copy" aria-hidden="true" />
      </button>
    )

  return (
    <div className="chat-source chat-block-wide">
      {title ? (
        <div className="chat-source-toolbar">
          <p className="chat-source-label">{title}</p>
          {copyButton}
        </div>
      ) : (
        copyButton
      )}
      <pre className="chat-source-code">{children}</pre>
    </div>
  )
}
