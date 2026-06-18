import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import {
  type AgentCommerceFilterDsl,
  type AgentCommerceLeafDsl,
  type DslLogicalOperator,
  UI_OPERATORS,
  UiFilterOperator,
  buildAgentCommerceFilterDsl,
  composeConditions,
  defaultCommerceFilterDsl,
  dslOperatorToUi,
  filterSupportsFormEditing,
  flattenLeavesForForm,
  isCompoundFilter,
  isCommerceFilterValid,
  isDslLeafOperator,
  operatorRequiresValue,
  operatorUsesMultiValue,
  formatMultiValueList,
  parseMultiValueList,
  parseAgentCommerceFilterDsl,
  stringifyFilterDsl,
} from '../../../utils/agentFilterDslHelpers'
import { useCommerceFilterDslAssistant } from '../../../hooks/useCommerceFilterDslAssistant'

export interface AgentFilterDslEditorProps {
  value: AgentCommerceFilterDsl | null
  onChange: (value: AgentCommerceFilterDsl | null) => void
  layout?: 'tabs' | 'split'
  assistantDialogVisible?: boolean
  onAssistantDialogVisibleChange?: (visible: boolean) => void
}

type EditorTab = 'form' | 'json' | 'assistant'

const logicFromUiKey = (uiKey: string): DslLogicalOperator =>
  uiKey === 'any' ? '$or' : '$and'

const logicToUiKey = (op: DslLogicalOperator): string =>
  op === '$or' ? 'any' : 'all'

const patchLeafFields = (
  leaf: AgentCommerceLeafDsl,
  patch: {
    left?: string
    uiOp?: UiFilterOperator
    multi?: string[]
    single?: string
  }
): AgentCommerceLeafDsl => {
  const leftSrc = patch.left !== undefined ? patch.left : leaf.left
  const trimmedLeft = typeof leftSrc === 'string' ? leftSrc.trim() : ''

  const uiOp: UiFilterOperator =
    patch.uiOp ??
    (isDslLeafOperator(leaf.op) ? dslOperatorToUi(leaf.op) : 'notEquals')

  let valueArg: string | string[] | undefined
  if (operatorUsesMultiValue(uiOp)) {
    valueArg = patch.multi ?? (Array.isArray(leaf.right) ? leaf.right : [])
  } else if (operatorRequiresValue(uiOp)) {
    const raw =
      patch.single ??
      (typeof leaf.right === 'string' || typeof leaf.right === 'number'
        ? String(leaf.right)
        : '')
    valueArg = raw
  } else {
    valueArg = undefined
  }

  return buildAgentCommerceFilterDsl(trimmedLeft, uiOp, valueArg)
}

export const AgentFilterDslEditor: React.FC<AgentFilterDslEditorProps> = ({
  value,
  onChange,
  layout = 'tabs',
  assistantDialogVisible = false,
  onAssistantDialogVisibleChange,
}) => {
  const { t } = useTranslation()
  const isSplitLayout = layout === 'split'
  const dropdownAppendTo: 'self' | HTMLElement | undefined = isSplitLayout
    ? typeof document === 'undefined'
      ? undefined
      : document.body
    : 'self'
  const fallbackLeaf = defaultCommerceFilterDsl()
  const effectiveRoot = value ?? fallbackLeaf

  const tabIds = useMemo(
    (): EditorTab[] => ['form', 'json', 'assistant'] as const,
    []
  )

  const [focusRuleIndex, setFocusRuleIndex] = useState<number | null>(null)
  const [multiValueDrafts, setMultiValueDrafts] = useState<
    Record<number, string>
  >({})
  const [pendingLogic, setPendingLogic] = useState<DslLogicalOperator>('$and')
  useEffect(() => {
    if (value !== null && isCompoundFilter(value)) {
      setPendingLogic(value.op)
    }
  }, [value])

  const formModel =
    value !== null && filterSupportsFormEditing(value)
      ? flattenLeavesForForm(value)
      : null
  const complexFilter = Boolean(
    value !== null && !filterSupportsFormEditing(value)
  )

  const [activeTab, setActiveTab] = useState<EditorTab>('form')

  useEffect(() => {
    if (!tabIds.includes(activeTab)) {
      setActiveTab('form')
    }
  }, [activeTab, tabIds])

  const assistantHookTab: EditorTab =
    isSplitLayout && assistantDialogVisible ? 'assistant' : activeTab

  const [jsonText, setJsonText] = useState(() =>
    stringifyFilterDsl(value ?? effectiveRoot)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(stringifyFilterDsl(value ?? defaultCommerceFilterDsl()))
    setJsonError(null)
    setMultiValueDrafts({})
  }, [value])

  const tryCommitParsedFilter = useCallback(
    (
      parsed: unknown,
      onFail: (message: string) => void
    ): AgentCommerceFilterDsl | null => {
      const result = parseAgentCommerceFilterDsl(parsed)
      if (result.dsl && !result.error) {
        if (!isCommerceFilterValid(result.dsl)) {
          onFail(t('commerce_filter_invalid'))
          return null
        }
        return result.dsl
      }
      if (result.error) {
        onFail(
          result.errorOpts ? t(result.error, result.errorOpts) : t(result.error)
        )
        return null
      }
      onFail(t('commerce_filter_invalid_json'))
      return null
    },
    [t]
  )

  const [pendingAssistantDialogClose, setPendingAssistantDialogClose] =
    useState(false)

  const onApplyGeneratedDsl = useCallback(
    (dsl: AgentCommerceFilterDsl) => {
      onChange(dsl)
      setJsonText(stringifyFilterDsl(dsl))
      setJsonError(null)
      if (isSplitLayout) {
        setPendingAssistantDialogClose(true)
      } else {
        setActiveTab('json')
      }
    },
    [isSplitLayout, onChange]
  )

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
  } = useCommerceFilterDslAssistant({
    activeTab: assistantHookTab,
    tryCommitParsedFilter,
    onApplyGeneratedDsl,
  })

  useEffect(() => {
    if (!pendingAssistantDialogClose || !isSplitLayout) {
      return
    }
    onAssistantDialogVisibleChange?.(false)
    setAssistantPrompt('')
    setAssistantError(null)
    setPendingAssistantDialogClose(false)
  }, [
    isSplitLayout,
    onAssistantDialogVisibleChange,
    pendingAssistantDialogClose,
    setAssistantError,
    setAssistantPrompt,
  ])

  const operatorOptions = useMemo(
    () =>
      UI_OPERATORS.map((op) => ({
        label: t(`commerce_filter_op_${op}`),
        value: op,
      })),
    [t]
  )

  const combineOptions = useMemo(
    () => [
      {
        label: t('commerce_filter_match_all'),
        value: 'all',
      },
      {
        label: t('commerce_filter_match_any'),
        value: 'any',
      },
    ],
    [t]
  )

  const commitLeaves = useCallback(
    (
      nextLeaves: AgentCommerceLeafDsl[],
      logicOverride?: DslLogicalOperator
    ) => {
      if (!nextLeaves.length) {
        onChange(null)
        return
      }
      if (nextLeaves.length === 1) {
        onChange({ ...nextLeaves[0] })
        return
      }
      const logic = logicOverride ?? pendingLogic
      const composed = composeConditions(logic, nextLeaves)
      if (composed !== null) onChange(composed)
    },
    [onChange, pendingLogic]
  )

  const updateRuleAt = useCallback(
    (
      index: number,
      patch: {
        left?: string
        uiOp?: UiFilterOperator
        multi?: string[]
        single?: string
      }
    ) => {
      if (value === null) return
      const model = flattenLeavesForForm(value)
      if (!model || index < 0 || index >= model.leaves.length) return
      const nextLeaves = model.leaves.map((leaf, i) =>
        i === index ? patchLeafFields(leaf, patch) : leaf
      )
      commitLeaves(nextLeaves)
    },
    [value, commitLeaves]
  )

  const addRule = useCallback(() => {
    if (value === null) {
      setFocusRuleIndex(0)
      onChange(defaultCommerceFilterDsl())
      return
    }
    const model = flattenLeavesForForm(value)
    if (!model) return
    setFocusRuleIndex(model.leaves.length)
    const nextLeaves = [...model.leaves, defaultCommerceFilterDsl()]
    commitLeaves(nextLeaves)
  }, [value, onChange, commitLeaves])

  const removeRuleAt = useCallback(
    (index: number) => {
      if (value === null) return
      const model = flattenLeavesForForm(value)
      if (!model || index < 0 || index >= model.leaves.length) return
      commitLeaves(model.leaves.filter((_, i) => i !== index))
    },
    [value, commitLeaves]
  )

  const handleCombineChange = useCallback(
    (uiKey: string) => {
      const logic = logicFromUiKey(uiKey)
      setPendingLogic(logic)
      if (value === null) return
      const model = flattenLeavesForForm(value)
      if (model && model.leaves.length >= 2) {
        commitLeaves(model.leaves, logic)
      }
    },
    [value, commitLeaves]
  )

  const applyJsonFromText = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as unknown
      const dsl = tryCommitParsedFilter(parsed, (msg) => setJsonError(msg))
      if (dsl) {
        onChange(dsl)
        setJsonError(null)
        return true
      }
      return false
    } catch {
      setJsonError(t('commerce_filter_json_parse_error'))
      return false
    }
  }, [jsonText, onChange, t, tryCommitParsedFilter])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
    } catch {
      void 0
    }
  }, [jsonText])

  const handleResetFilter = useCallback(() => {
    const resetValue = defaultCommerceFilterDsl()
    onChange(resetValue)
    setJsonText(stringifyFilterDsl(resetValue))
    setJsonError(null)
  }, [onChange])

  const closeAssistantDialog = useCallback(() => {
    onAssistantDialogVisibleChange?.(false)
    setAssistantPrompt('')
    setAssistantError(null)
  }, [onAssistantDialogVisibleChange, setAssistantError, setAssistantPrompt])

  const generateConditionPromptRef = useRef<HTMLTextAreaElement>(null)

  const focusGenerateConditionPrompt = useCallback(() => {
    if (!assistantDialogVisible || helperAgentPresent !== true) {
      return
    }

    window.setTimeout(() => {
      generateConditionPromptRef.current?.focus()
    }, 50)
  }, [assistantDialogVisible, helperAgentPresent])

  useEffect(() => {
    focusGenerateConditionPrompt()
  }, [focusGenerateConditionPrompt])

  const handleAssistantDialogApply = useCallback(() => {
    void handleAssistantGenerate()
  }, [handleAssistantGenerate])

  const tabLabelKey = useCallback((tab: EditorTab): string => {
    if (tab === 'form') return 'commerce_filter_tab_form'
    if (tab === 'json') return 'commerce_filter_tab_json'
    return 'commerce_filter_tab_assistant'
  }, [])

  const filterValid = !value || isCommerceFilterValid(value)

  const renderRuleFields = (
    leaf: AgentCommerceLeafDsl,
    idx: number,
    uiOp: UiFilterOperator,
    displayLeft: string,
    pathInvalid: boolean
  ) => {
    const valueInvalid =
      operatorRequiresValue(uiOp) &&
      (operatorUsesMultiValue(uiOp)
        ? !(Array.isArray(leaf.right) && leaf.right.length > 0)
        : leaf.right === undefined || leaf.right === null || leaf.right === '')

    const fields = (
      <>
        <div className="form-field">
          <label className="field-label">
            {t('commerce_filter_payload_field')}
          </label>
          <InputText
            value={displayLeft}
            onChange={(e) => updateRuleAt(idx, { left: e.target.value })}
            className={`w-full ${pathInvalid ? 'p-invalid' : ''}`}
            placeholder={t('commerce_filter_payload_placeholder')}
            autoFocus={idx === focusRuleIndex}
          />
        </div>

        <div className="form-field">
          <label className="field-label">{t('commerce_filter_operator')}</label>
          <Dropdown
            value={uiOp}
            options={operatorOptions}
            onChange={(e) =>
              updateRuleAt(idx, {
                uiOp: e.value as UiFilterOperator,
              })
            }
            className="w-full"
            appendTo={dropdownAppendTo}
          />
        </div>

        {operatorRequiresValue(uiOp) && (
          <div className="form-field">
            <label className="field-label">
              {operatorUsesMultiValue(uiOp)
                ? `${t('commerce_filter_values')} *`
                : `${t('commerce_filter_value')} *`}
            </label>
            {operatorUsesMultiValue(uiOp) ? (
              <InputTextarea
                value={
                  multiValueDrafts[idx] ??
                  formatMultiValueList(
                    Array.isArray(leaf.right) ? leaf.right.map(String) : []
                  )
                }
                onChange={(e) => {
                  setMultiValueDrafts((prev) => ({
                    ...prev,
                    [idx]: e.target.value,
                  }))
                }}
                onBlur={() => {
                  const draft = multiValueDrafts[idx]
                  if (draft === undefined) {
                    return
                  }

                  updateRuleAt(idx, { multi: parseMultiValueList(draft) })
                  setMultiValueDrafts((prev) => {
                    const next = { ...prev }
                    delete next[idx]
                    return next
                  })
                }}
                rows={isSplitLayout ? 1 : 2}
                className={`w-full text-mono${valueInvalid ? ' p-invalid' : ''}`}
                placeholder={t('commerce_filter_csv_placeholder')}
              />
            ) : (
              <InputText
                value={
                  leaf.right === undefined || leaf.right === null
                    ? ''
                    : String(leaf.right)
                }
                onChange={(e) => updateRuleAt(idx, { single: e.target.value })}
                className={`w-full text-mono${valueInvalid ? ' p-invalid' : ''}`}
                placeholder={t('commerce_filter_single_value_placeholder')}
              />
            )}
          </div>
        )}
      </>
    )

    if (isSplitLayout) {
      return <div className="agent-filter-dsl-rule-body">{fields}</div>
    }

    return fields
  }

  const renderFormPanel = () => (
    <>
      {complexFilter && (
        <div
          className={
            isSplitLayout
              ? 'commerce-filter-json-only-notice commerce-filter-json-only-notice--split'
              : 'commerce-filter-json-only-notice'
          }
          role="status"
        >
          {isSplitLayout ? (
            <>
              <i className="pi pi-info-circle" aria-hidden="true" />
              <span>{t('commerce_filter_complex_use_json')}</span>
            </>
          ) : (
            t('commerce_filter_complex_use_json')
          )}
        </div>
      )}

      {!complexFilter && value === null && (
        <>
          <p className="agent-filter-dsl-empty-hint">
            {t('commerce_filter_none')}
          </p>
          <div className="agent-filter-dsl-actions agent-filter-dsl-actions--empty">
            <Button
              type="button"
              icon="pi pi-plus"
              className={
                isSplitLayout
                  ? 'p-button agent-filter-dsl-add-icon-btn'
                  : 'p-button-secondary commerce-filter-add-condition'
              }
              aria-label={t('commerce_filter_add_condition')}
              onClick={addRule}
            />
          </div>
        </>
      )}

      {!complexFilter && formModel && (
        <>
          <div className="form-field">
            <label className="field-label">
              {t('commerce_filter_combine')}
            </label>
            <Dropdown
              value={logicToUiKey(pendingLogic)}
              options={combineOptions}
              className="w-full"
              onChange={(e) => handleCombineChange(String(e.value))}
              disabled={formModel.leaves.length < 2}
              appendTo={dropdownAppendTo}
            />
            {formModel.leaves.length < 2 && (
              <small className="commerce-filter-field-hint">
                {t('commerce_filter_need_two_for_logic')}
              </small>
            )}
          </div>

          {formModel.leaves.map((leaf, idx) => {
            const uiOp: UiFilterOperator = isDslLeafOperator(leaf.op)
              ? dslOperatorToUi(leaf.op)
              : 'notEquals'
            const displayLeft = leaf.left
            const pathInvalid = !displayLeft.trim()

            return (
              <div
                key={idx}
                className={`agent-filter-dsl-rule${isSplitLayout ? ' agent-filter-dsl-rule--split' : ''}`}
              >
                <div className="agent-filter-dsl-rule-header">
                  <span className="agent-filter-dsl-rule-title">
                    {t('commerce_filter_rule_label', {
                      n: idx + 1,
                    })}
                  </span>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    className="p-button-text p-button-rounded agent-filter-dsl-rule-remove"
                    aria-label={t('commerce_filter_remove_condition')}
                    onClick={() => removeRuleAt(idx)}
                  />
                </div>

                {renderRuleFields(leaf, idx, uiOp, displayLeft, pathInvalid)}
              </div>
            )
          })}

          {isSplitLayout ? (
            <Button
              type="button"
              icon="pi pi-plus"
              className="p-button agent-filter-dsl-add-icon-btn"
              aria-label={t('commerce_filter_add_condition')}
              onClick={addRule}
            />
          ) : (
            <Button
              type="button"
              label={t('commerce_filter_add_condition')}
              icon="pi pi-plus"
              className="p-button-secondary commerce-filter-add-condition"
              onClick={addRule}
            />
          )}
        </>
      )}

      {!filterValid && (
        <small className="p-error commerce-filter-validation-error">
          {t('commerce_filter_invalid')}
        </small>
      )}
    </>
  )

  const renderJsonPanel = () => (
    <>
      {!isSplitLayout && (
        <div className="agent-filter-dsl-json-toolbar">
          <Button
            type="button"
            label={t('commerce_filter_apply_json')}
            className="p-button-secondary"
            onClick={() => applyJsonFromText()}
          />
          <Button
            type="button"
            icon="pi pi-copy"
            className="p-button-text p-button-rounded"
            aria-label={t('copy')}
            onClick={handleCopy}
          />
        </div>
      )}
      <InputTextarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value)
          setJsonError(null)
        }}
        rows={isSplitLayout ? 10 : 12}
        className={`w-full agent-filter-dsl-json-area text-mono ${jsonError ? 'p-invalid' : ''}${isSplitLayout ? ' agent-filter-dsl-json-area--split' : ''}`}
        spellCheck={false}
      />
      {jsonError && <small className="p-error">{jsonError}</small>}
      {isSplitLayout && (
        <div className="agent-filter-dsl-split-json-actions">
          <Button
            type="button"
            label={t('reset')}
            className="p-button-outlined agent-filter-dsl-json-reset-btn"
            onClick={handleResetFilter}
          />
          <Button
            type="button"
            label={t('apply')}
            className="agent-filter-dsl-json-apply-btn"
            onClick={() => applyJsonFromText()}
          />
        </div>
      )}
    </>
  )

  const renderAssistantContent = (inDialog = false) => (
    <div
      className={`commerce-filter-assistant-panel${inDialog ? ' commerce-filter-assistant-panel--dialog' : ''}`}
    >
      {inDialog && assistantWorking && (
        <div
          className="generate-condition-dialog-blocker"
          role="status"
          aria-live="polite"
        >
          <ProgressSpinner aria-label={t('generate_condition_working')} />
        </div>
      )}
      {helperAgentPresent === null && (
        <div
          className="commerce-filter-assistant-loading state-loading"
          role="status"
          aria-live="polite"
        >
          <ProgressSpinner
            aria-label={t('commerce_filter_assistant_checking')}
          />
          <span className="commerce-filter-assistant-loading-label">
            {t('commerce_filter_assistant_checking')}
          </span>
        </div>
      )}
      {helperAgentPresent === false && (
        <div className="commerce-filter-assistant-intro" role="status">
          <p>{t('commerce_filter_assistant_intro')}</p>
          <Button
            type="button"
            label={t('commerce_filter_assistant_enable')}
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
          {!inDialog && (
            <div className="form-field">
              <label
                className="field-label"
                htmlFor="commerce-filter-assistant-prompt"
              >
                {t('commerce_filter_assistant_prompt_label')}
              </label>
            </div>
          )}
          <InputTextarea
            id={
              inDialog
                ? 'generate-condition-prompt'
                : 'commerce-filter-assistant-prompt'
            }
            ref={inDialog ? generateConditionPromptRef : undefined}
            value={assistantPrompt}
            onChange={(e) => {
              setAssistantPrompt(e.target.value)
              setAssistantError(null)
            }}
            rows={inDialog ? 8 : 6}
            className={`w-full ${assistantError ? 'p-invalid' : ''}`}
            placeholder={
              inDialog
                ? t('generate_condition_prompt_placeholder')
                : t('commerce_filter_assistant_prompt_placeholder')
            }
            disabled={assistantWorking}
            autoFocus={inDialog}
          />
          {!inDialog && (
            <div className="commerce-filter-assistant-actions">
              <Button
                type="button"
                label={t('commerce_filter_assistant_generate')}
                icon="pi pi-send"
                className="p-button-secondary"
                loading={assistantWorking}
                disabled={assistantWorking || !assistantPrompt.trim()}
                onClick={() => void handleAssistantGenerate()}
              />
            </div>
          )}
          {assistantError && (
            <small className="p-error">{assistantError}</small>
          )}
        </>
      )}
    </div>
  )

  if (value === null && !isSplitLayout) {
    return (
      <div className="agent-filter-dsl-editor">
        <p className="agent-filter-dsl-empty-hint">
          {t('commerce_filter_none')}
        </p>
        <div className="agent-filter-dsl-actions agent-filter-dsl-actions--empty">
          <Button
            type="button"
            label={t('commerce_filter_add')}
            onClick={addRule}
          />
        </div>
      </div>
    )
  }

  if (isSplitLayout) {
    return (
      <>
        <div className="agent-filter-dsl-editor agent-filter-dsl-editor--split">
          <div className="agent-filter-dsl-split">
            <div className="agent-filter-dsl-split-form">
              {renderFormPanel()}
            </div>
            <div
              className="agent-filter-dsl-split-divider"
              aria-hidden="true"
            />
            <div className="agent-filter-dsl-split-json">
              {renderJsonPanel()}
            </div>
          </div>
        </div>

        <Dialog
          visible={assistantDialogVisible}
          onHide={closeAssistantDialog}
          onShow={focusGenerateConditionPrompt}
          focusOnShow={false}
          header={
            <span className="generate-condition-dialog-header">
              <i className="pi pi-sparkles" aria-hidden="true" />
              {t('generate_condition')}
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
                onClick={closeAssistantDialog}
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
                onClick={() => void handleAssistantDialogApply()}
              />
            </div>
          }
        >
          {renderAssistantContent(true)}
        </Dialog>
      </>
    )
  }

  return (
    <div className="agent-filter-dsl-editor">
      <div className="agent-filter-dsl-tabs" role="tablist">
        {tabIds.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`agent-filter-dsl-tab${activeTab === tab ? ' agent-filter-dsl-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(tabLabelKey(tab))}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'form' && renderFormPanel()}

        {activeTab === 'json' && renderJsonPanel()}

        {activeTab === 'assistant' && renderAssistantContent()}
      </div>

      <div className="agent-filter-dsl-actions">
        <Button
          type="button"
          label={t('commerce_filter_reset')}
          className="p-button-secondary"
          onClick={handleResetFilter}
        />
        <Button
          type="button"
          label={t('commerce_filter_remove')}
          className="p-button-secondary"
          onClick={() => onChange(null)}
        />
      </div>
    </div>
  )
}
