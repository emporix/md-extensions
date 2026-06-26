import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useJsonSchemaAssistant } from '../../../hooks/useJsonSchemaAssistant'

interface GenerateJsonSchemaDialogProps {
  visible: boolean
  onHide: () => void
  onApply: (formattedSchema: string) => void
}

export const GenerateJsonSchemaDialog: React.FC<GenerateJsonSchemaDialogProps> =
  ({ visible, onHide, onApply }) => {
    const { t } = useTranslation()
    const promptRef = useRef<HTMLTextAreaElement>(null)

    const {
      assistantPrompt,
      setAssistantPrompt,
      assistantError,
      setAssistantError,
      helperAgentPresent,
      provisioningAgent,
      assistantWorking,
      handleEnableHelperAgent,
      handleAssistantGenerate,
      resetAssistantState,
    } = useJsonSchemaAssistant({
      visible,
      onApplyGeneratedSchema: onApply,
      onClose: onHide,
    })

    const handleHide = useCallback(() => {
      resetAssistantState()
      onHide()
    }, [onHide, resetAssistantState])

    const focusPrompt = useCallback(() => {
      if (!visible || helperAgentPresent !== true) {
        return
      }

      window.setTimeout(() => {
        promptRef.current?.focus()
      }, 50)
    }, [helperAgentPresent, visible])

    useEffect(() => {
      focusPrompt()
    }, [focusPrompt])

    return (
      <Dialog
        visible={visible}
        onHide={handleHide}
        onShow={focusPrompt}
        focusOnShow={false}
        header={
          <span className="generate-condition-dialog-header">
            <i className="pi pi-sparkles" aria-hidden="true" />
            {t('generate_json_schema')}
          </span>
        }
        className="generate-condition-dialog"
        modal
        draggable={false}
        footer={
          <div className="generate-condition-dialog-footer">
            <Button
              type="button"
              label={t('discard')}
              className="p-button-outlined generate-condition-discard-btn"
              onClick={handleHide}
            />
            <Button
              type="button"
              label={t('apply')}
              className="generate-condition-apply-btn"
              disabled={
                assistantWorking ||
                helperAgentPresent !== true ||
                !assistantPrompt.trim()
              }
              onClick={() => void handleAssistantGenerate()}
            />
          </div>
        }
      >
        <div className="commerce-filter-assistant-panel commerce-filter-assistant-panel--dialog">
          {assistantWorking && (
            <div
              className="generate-condition-dialog-blocker"
              role="status"
              aria-live="polite"
            >
              <ProgressSpinner aria-label={t('generate_json_schema_working')} />
            </div>
          )}
          {helperAgentPresent === null && (
            <div
              className="commerce-filter-assistant-loading state-loading"
              role="status"
              aria-live="polite"
            >
              <ProgressSpinner
                aria-label={t('json_schema_assistant_checking')}
              />
              <span className="commerce-filter-assistant-loading-label">
                {t('json_schema_assistant_checking')}
              </span>
            </div>
          )}
          {helperAgentPresent === false && (
            <div className="commerce-filter-assistant-intro" role="status">
              <p>{t('json_schema_assistant_intro')}</p>
              <Button
                type="button"
                label={t('json_schema_assistant_enable')}
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
              <InputTextarea
                id="generate-json-schema-prompt"
                ref={promptRef}
                value={assistantPrompt}
                onChange={(e) => {
                  setAssistantPrompt(e.target.value)
                  setAssistantError(null)
                }}
                rows={8}
                className={`w-full ${assistantError ? 'p-invalid' : ''}`}
                placeholder={t('generate_json_schema_prompt_placeholder')}
                disabled={assistantWorking}
              />
              {assistantError && (
                <small className="p-error">{assistantError}</small>
              )}
            </>
          )}
        </div>
      </Dialog>
    )
  }
