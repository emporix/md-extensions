import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import {
  McpToolInvocationArgsLocation,
  McpToolInvocationMethod,
  ProjectCloudFunction,
} from '../../types/Mcp'
import { HOSTING_PAGE_PATH } from '../../constants/paths'
import {
  getMcpToolArgsLocationOptions,
  getMcpToolInvocationMethodOptions,
} from '../../utils/mcpHelpers'
import { McpRequiredMark } from './McpRequiredMark'

interface McpToolInvocationSectionProps {
  functionId: string
  method: McpToolInvocationMethod | string
  argsLocation?: McpToolInvocationArgsLocation | string
  functions: ProjectCloudFunction[]
  functionsLoading: boolean
  functionsLoadError?: string | null
  featureDisabled: boolean
  required?: boolean
  onRefreshFunctions: () => void
  onFunctionIdChange: (value: string) => void
  onFunctionSelected: (value: string) => void
  onMethodChange: (value: McpToolInvocationMethod | string) => void
  onArgsLocationChange: (value: McpToolInvocationArgsLocation | string) => void
}

export const McpToolInvocationSection = ({
  functionId,
  method,
  argsLocation,
  functions,
  functionsLoading,
  functionsLoadError,
  featureDisabled,
  required = true,
  onRefreshFunctions,
  onFunctionIdChange,
  onFunctionSelected,
  onMethodChange,
  onArgsLocationChange,
}: McpToolInvocationSectionProps) => {
  const { t } = useTranslation()
  const methodOptions = useMemo(() => getMcpToolInvocationMethodOptions(), [])
  const argsLocationOptions = useMemo(
    () => getMcpToolArgsLocationOptions(t),
    [t]
  )
  const functionOptions = useMemo(
    () =>
      [...functions]
        .filter((fn) => fn.streaming !== true)
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        )
        .map((fn) => ({
          label: `${fn.name} (${fn.id})`,
          value: fn.id,
        })),
    [functions]
  )

  const showManualFunctionId =
    featureDisabled || !!functionsLoadError || functionOptions.length === 0

  return (
    <div className="mcp-tool-invocation-section">
      {featureDisabled ? (
        <Message
          severity="info"
          text={t('mcp_tool_functions_feature_disabled')}
          className="mcp-tool-functions-hint"
        />
      ) : null}

      {functionsLoadError ? (
        <Message
          severity="warn"
          text={functionsLoadError}
          className="mcp-tool-functions-hint"
        />
      ) : null}

      <div className="mcp-detail-form-row mcp-tool-invocation-row">
        <div className="form-field">
          <div className="mcp-tool-function-label-row">
            <label className="field-label">
              {t('mcp_tool_function_id')}
              {required ? <McpRequiredMark /> : null}
            </label>
            <a
              href={HOSTING_PAGE_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="mcp-tool-create-function-btn"
            >
              {t('mcp_tool_create_function')}
              <i className="pi pi-external-link" aria-hidden="true" />
            </a>
            <button
              type="button"
              className="mcp-tool-functions-refresh-btn"
              aria-label={t('mcp_tool_functions_refresh')}
              title={t('mcp_tool_functions_refresh')}
              disabled={functionsLoading}
              onClick={onRefreshFunctions}
            >
              <i
                className={
                  functionsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'
                }
              />
            </button>
          </div>
          {showManualFunctionId ? (
            <InputText
              value={functionId}
              onChange={(event) => onFunctionIdChange(event.target.value)}
              className={`w-full${required && !functionId.trim() ? ' p-invalid' : ''}`}
              placeholder={t('mcp_tool_function_id_placeholder')}
            />
          ) : (
            <Dropdown
              value={functionId || null}
              options={functionOptions}
              onChange={(event) => onFunctionSelected(event.value ?? '')}
              className={`w-full${required && !functionId.trim() ? ' p-invalid' : ''}`}
              placeholder={t('mcp_tool_function_id_placeholder')}
              filter
              showClear
              appendTo="self"
            />
          )}
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('mcp_tool_http_method')}
            {required ? <McpRequiredMark /> : null}
          </label>
          <Dropdown
            value={method}
            options={methodOptions}
            onChange={(event) => onMethodChange(event.value)}
            className="w-full"
            appendTo="self"
          />
        </div>

        <div className="form-field">
          <label className="field-label">{t('mcp_tool_args_location')}</label>
          <Dropdown
            value={argsLocation ?? McpToolInvocationArgsLocation.BODY}
            options={argsLocationOptions}
            onChange={(event) => onArgsLocationChange(event.value)}
            className="w-full"
            appendTo="self"
          />
        </div>
      </div>
    </div>
  )
}
