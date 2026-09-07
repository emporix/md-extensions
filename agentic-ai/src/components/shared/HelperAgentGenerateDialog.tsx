import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AssistantStreamPreview } from './AssistantStreamPreview'

export type HelperAgentGenerateDialogState = {
  readonly assistantError: string | null
  readonly helperAgentPresent: boolean | null
  readonly provisioningAgent: boolean
  readonly assistantWorking: boolean
  readonly assistantStreamText: string
  readonly assistantToolName: string | null
  readonly handleEnableHelperAgent: () => Promise<void>
  readonly handleAssistantGenerate: () => void
  readonly resetAssistantState: () => void
}

type HelperAgentGenerateDialogProps = {
  readonly visible: boolean
  readonly titleKey: string
  readonly introKey: string
  readonly readyKey: string
  readonly workingLabelKey: string
  readonly state: HelperAgentGenerateDialogState
  readonly onHide: () => void
}

export const HelperAgentGenerateDialog: React.FC<
  HelperAgentGenerateDialogProps
> = ({
  visible,
  titleKey,
  introKey,
  readyKey,
  workingLabelKey,
  state,
  onHide,
}) => {
  const { t } = useTranslation()
  const {
    assistantError,
    helperAgentPresent,
    provisioningAgent,
    assistantWorking,
    assistantStreamText,
    assistantToolName,
    handleEnableHelperAgent,
    handleAssistantGenerate,
    resetAssistantState,
  } = state

  const handleHide = useCallback(() => {
    resetAssistantState()
    onHide()
  }, [onHide, resetAssistantState])

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      closable={!assistantWorking}
      header={
        <span className="generate-condition-dialog-header">
          <i className="pi pi-sparkles" aria-hidden="true" />
          {t(titleKey)}
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
              provisioningAgent ||
              helperAgentPresent !== true
            }
            onClick={() => handleAssistantGenerate()}
          />
        </div>
      }
    >
      <div className="commerce-filter-assistant-panel commerce-filter-assistant-panel--dialog">
        {helperAgentPresent === null && (
          <div
            className="commerce-filter-assistant-loading state-loading"
            role="status"
            aria-live="polite"
          >
            <ProgressSpinner aria-label={t('json_schema_assistant_checking')} />
            <span className="commerce-filter-assistant-loading-label">
              {t('json_schema_assistant_checking')}
            </span>
          </div>
        )}
        {helperAgentPresent === false && (
          <div className="commerce-filter-assistant-intro" role="status">
            <p>{t(introKey)}</p>
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
            <p className="mcp-tool-input-schema-assistant-ready">
              {t(readyKey)}
            </p>
            {assistantError ? (
              <small className="p-error" role="alert">
                {assistantError}
              </small>
            ) : null}
            <AssistantStreamPreview
              streamText={assistantStreamText}
              toolName={assistantToolName}
              working={assistantWorking}
              workingLabelKey={workingLabelKey}
            />
          </>
        )}
      </div>
    </Dialog>
  )
}
