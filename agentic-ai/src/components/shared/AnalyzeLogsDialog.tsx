import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useLogAnalysisAssistant } from '../../hooks/useLogAnalysisAssistant'
import { extractLogAnalysisDisplayText } from '../../utils/logAnalysisAssistantHelpers'
import type { LogAnalysisEntry } from '../../utils/logAnalysisAssistantHelpers'
import '../../styles/components/AnalyzeLogsDialog.css'

type AnalyzeLogsDialogProps = {
  readonly visible: boolean
  readonly onHide: () => void
  readonly logMessages: readonly LogAnalysisEntry[]
}

export const AnalyzeLogsDialog = ({
  visible,
  onHide,
  logMessages,
}: AnalyzeLogsDialogProps) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    inputValue,
    setInputValue,
    helperAgentPresent,
    provisioningAgent,
    working,
    streamText,
    toolName,
    handleEnableHelperAgent,
    handleSendMessage,
    resetState,
  } = useLogAnalysisAssistant({
    visible,
    logMessages,
  })

  const handleHide = useCallback(() => {
    resetState()
    onHide()
  }, [onHide, resetState])

  const handleSubmit = useCallback(() => {
    void handleSendMessage(inputValue)
  }, [handleSendMessage, inputValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText, working])

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={
        <span className="analyze-logs-dialog-header">
          <i className="pi pi-sparkles" aria-hidden="true" />
          {t('analyze_logs_dialog_title')}
        </span>
      }
      className="analyze-logs-dialog generate-condition-dialog"
      modal
      draggable={false}
    >
      <div className="analyze-logs-dialog-content">
        {helperAgentPresent === null && (
          <div
            className="commerce-filter-assistant-loading state-loading"
            role="status"
            aria-live="polite"
          >
            <ProgressSpinner
              aria-label={t('log_analysis_assistant_checking')}
            />
            <span className="commerce-filter-assistant-loading-label">
              {t('log_analysis_assistant_checking')}
            </span>
          </div>
        )}

        {helperAgentPresent === false && (
          <div className="commerce-filter-assistant-intro" role="status">
            <p>{t('log_analysis_assistant_intro')}</p>
            <Button
              type="button"
              label={t('log_analysis_assistant_enable')}
              icon="pi pi-plus"
              className="p-button-secondary commerce-filter-assistant-enable"
              loading={provisioningAgent}
              disabled={provisioningAgent}
              onClick={() => void handleEnableHelperAgent()}
            />
          </div>
        )}

        {helperAgentPresent === true && (
          <>
            <div className="analyze-logs-chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`analyze-logs-chat-message analyze-logs-chat-message--${message.role}`}
                  role={message.role === 'error' ? 'alert' : undefined}
                >
                  <div
                    className={`analyze-logs-chat-bubble${
                      message.role === 'error'
                        ? ' analyze-logs-chat-bubble--error'
                        : ''
                    }`}
                  >
                    {message.role === 'user'
                      ? message.content
                      : extractLogAnalysisDisplayText(message.content)}
                  </div>
                </div>
              ))}

              {working && (
                <div className="analyze-logs-chat-message analyze-logs-chat-message--assistant">
                  <div className="analyze-logs-chat-bubble analyze-logs-chat-bubble--streaming">
                    {toolName && (
                      <span className="assistant-stream-preview-tool">
                        {t('assistant_stream_running_tool', { toolName })}
                      </span>
                    )}
                    {streamText ? (
                      <pre className="analyze-logs-chat-stream text-mono">
                        {extractLogAnalysisDisplayText(streamText)}
                      </pre>
                    ) : (
                      <span className="analyze-logs-chat-waiting">
                        {t('assistant_stream_waiting')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="analyze-logs-chat-input-row">
              <InputTextarea
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={3}
                autoResize
                className="analyze-logs-chat-input w-full"
                placeholder={t('log_analysis_chat_placeholder')}
                disabled={working}
              />
              <Button
                type="button"
                label={t('send')}
                icon="pi pi-send"
                className="analyze-logs-chat-send-btn"
                disabled={working || !inputValue.trim()}
                onClick={handleSubmit}
              />
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
