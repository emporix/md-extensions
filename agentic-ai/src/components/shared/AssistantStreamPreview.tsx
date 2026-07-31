import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from 'primereact/progressspinner'

type AssistantStreamPreviewProps = {
  readonly streamText: string
  readonly toolName: string | null
  readonly working: boolean
  readonly workingLabelKey: string
}

export const AssistantStreamPreview = ({
  streamText,
  toolName,
  working,
  workingLabelKey,
}: AssistantStreamPreviewProps) => {
  const { t } = useTranslation()
  const streamRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const element = streamRef.current
    if (!element) {
      return
    }
    element.scrollTop = element.scrollHeight
  }, [streamText])

  if (!working && !streamText) {
    return null
  }

  return (
    <div
      className="assistant-stream-preview"
      role="status"
      aria-live="polite"
      aria-busy={working}
    >
      <div className="assistant-stream-preview-header">
        {working && !streamText && (
          <ProgressSpinner
            className="assistant-stream-preview-spinner"
            aria-hidden="true"
          />
        )}
        <span className="assistant-stream-preview-label">
          {working ? t(workingLabelKey) : t('assistant_stream_complete')}
        </span>
        {toolName && (
          <span className="assistant-stream-preview-tool">
            {t('assistant_stream_running_tool', { toolName })}
          </span>
        )}
      </div>
      {streamText ? (
        <pre ref={streamRef} className="assistant-stream-preview-body text-mono">
          {streamText}
        </pre>
      ) : (
        working && (
          <p className="assistant-stream-preview-waiting">
            {t('assistant_stream_waiting')}
          </p>
        )
      )}
    </div>
  )
}
