import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
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
  parseAgentCommerceFilterDsl,
  stringifyFilterDsl,
} from '../../../utils/agentFilterDslHelpers'

export interface AgentFilterDslEditorProps {
  value: AgentCommerceFilterDsl | null
  onChange: (value: AgentCommerceFilterDsl | null) => void
}

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
}) => {
  const { t } = useTranslation()
  const fallbackLeaf = defaultCommerceFilterDsl()
  const effectiveRoot = value ?? fallbackLeaf

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

  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form')

  const [jsonText, setJsonText] = useState(() =>
    stringifyFilterDsl(value ?? effectiveRoot)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(stringifyFilterDsl(value ?? defaultCommerceFilterDsl()))
    setJsonError(null)
  }, [value])

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
    if (value === null) return
    const model = flattenLeavesForForm(value)
    if (!model) return
    const nextLeaves = [...model.leaves, defaultCommerceFilterDsl()]
    commitLeaves(nextLeaves)
  }, [value, commitLeaves])

  const removeRuleAt = useCallback(
    (index: number) => {
      if (value === null) return
      const model = flattenLeavesForForm(value)
      if (!model || model.leaves.length <= 1) return
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
      const result = parseAgentCommerceFilterDsl(parsed)
      if (result.dsl && !result.error) {
        if (!isCommerceFilterValid(result.dsl)) {
          setJsonError(t('commerce_filter_invalid'))
          return false
        }
        onChange(result.dsl)
        setJsonError(null)
        return true
      }
      if (result.error) {
        setJsonError(
          result.errorOpts
            ? t(result.error, result.errorOpts)
            : t(result.error)
        )
        return false
      }
      setJsonError(t('commerce_filter_invalid_json'))
      return false
    } catch {
      setJsonError(t('commerce_filter_json_parse_error'))
      return false
    }
  }, [jsonText, onChange, t])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
    } catch {
      void 0
    }
  }, [jsonText])

  const filterValid = isCommerceFilterValid(value ?? effectiveRoot)

  if (value === null) {
    return (
      <div className="agent-filter-dsl-editor">
        <p className="agent-filter-dsl-empty-hint">
          {t('commerce_filter_none')}
        </p>
        <div className="agent-filter-dsl-actions">
          <Button
            type="button"
            label={t('commerce_filter_add')}
            onClick={() => onChange(defaultCommerceFilterDsl())}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="agent-filter-dsl-editor">
      <div className="agent-filter-dsl-tabs" role="tablist">
        {(['form', 'json'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`agent-filter-dsl-tab${activeTab === tab ? ' agent-filter-dsl-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(tab === 'form' ? 'commerce_filter_tab_form' : 'commerce_filter_tab_json')}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'form' && (
          <>
            {complexFilter && (
              <div className="commerce-filter-json-only-notice" role="status">
                {t('commerce_filter_complex_use_json')}
              </div>
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
                  appendTo="self"
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
                  <div key={idx} className="agent-filter-dsl-rule">
                    <div className="agent-filter-dsl-rule-header">
                      <span className="agent-filter-dsl-rule-title">
                        {t('commerce_filter_rule_label', {
                          n: idx + 1,
                        })}
                      </span>
                      {formModel.leaves.length > 1 && (
                        <Button
                          type="button"
                          icon="pi pi-times"
                          className="p-button-text p-button-rounded"
                          aria-label={t('commerce_filter_remove_condition')}
                          onClick={() => removeRuleAt(idx)}
                        />
                      )}
                    </div>

                    <div className="form-field">
                      <label className="field-label">
                        {t('commerce_filter_payload_field')}
                      </label>
                      <InputText
                        value={displayLeft}
                        onChange={(e) =>
                          updateRuleAt(idx, { left: e.target.value })
                        }
                        className={`w-full ${pathInvalid ? 'p-invalid' : ''}`}
                        placeholder={t('commerce_filter_payload_placeholder')}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label">
                        {t('commerce_filter_operator')}
                      </label>
                      <Dropdown
                        value={uiOp}
                        options={operatorOptions}
                        onChange={(e) =>
                          updateRuleAt(idx, {
                            uiOp: e.value as UiFilterOperator,
                          })
                        }
                        className="w-full"
                        appendTo="self"
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
                            value={(Array.isArray(leaf.right)
                              ? leaf.right
                              : []
                            ).join(', ')}
                            onChange={(e) => {
                              const parts = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                              updateRuleAt(idx, { multi: parts })
                            }}
                            rows={2}
                            className="w-full text-mono"
                            placeholder={t('commerce_filter_csv_placeholder')}
                          />
                        ) : (
                          <InputText
                            value={
                              leaf.right === undefined || leaf.right === null
                                ? ''
                                : String(leaf.right)
                            }
                            onChange={(e) =>
                              updateRuleAt(idx, { single: e.target.value })
                            }
                            className="w-full text-mono"
                            placeholder={t(
                              'commerce_filter_single_value_placeholder'
                            )}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <Button
                type="button"
                label={t('commerce_filter_add_condition')}
                icon="pi pi-plus"
                className="p-button-secondary commerce-filter-add-condition"
                onClick={addRule}
              />
            </>
          )}

            {!filterValid && (
              <small className="p-error commerce-filter-validation-error">
                {t('commerce_filter_invalid')}
              </small>
            )}
          </>
        )}

        {activeTab === 'json' && (
          <>
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
            <InputTextarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                setJsonError(null)
              }}
              rows={12}
              className={`w-full agent-filter-dsl-json-area text-mono ${jsonError ? 'p-invalid' : ''}`}
              spellCheck={false}
            />
            {jsonError && <small className="p-error">{jsonError}</small>}
          </>
        )}
      </div>

      <div className="agent-filter-dsl-actions">
        <Button
          type="button"
          label={t('commerce_filter_reset')}
          className="p-button-secondary"
          onClick={() => onChange(defaultCommerceFilterDsl())}
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
