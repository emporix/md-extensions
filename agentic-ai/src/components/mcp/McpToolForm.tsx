import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import {
  McpTool,
  McpToolInvocationMethod,
  ProjectCloudFunction,
} from '../../types/Mcp'
import { IamScope } from '../../services/iamScopesService'
import { MCP_TOOL_NAME_PATTERN } from '../../utils/mcpHelpers'
import { McpRequiredMark } from './McpRequiredMark'
import { McpToolInputSchemaField } from './McpToolInputSchemaField'
import { McpToolRequiredScopesField } from './McpToolRequiredScopesField'
import { McpToolInvocationSection } from './McpToolInvocationSection'
import { GenerateMcpToolFromFunctionDialog } from './GenerateMcpToolFromFunctionDialog'

interface McpToolFormProps {
  tool: McpTool
  functions: ProjectCloudFunction[]
  functionsLoading: boolean
  functionsLoadError?: string | null
  featureDisabled: boolean
  onRefreshFunctions: () => void
  scopes: IamScope[]
  scopesLoading: boolean
  scopesLoadError?: string | null
  onChange: (tool: McpTool) => void
}

export const McpToolForm = ({
  tool,
  functions,
  functionsLoading,
  functionsLoadError,
  featureDisabled,
  onRefreshFunctions,
  scopes,
  scopesLoading,
  scopesLoadError,
  onChange,
}: McpToolFormProps) => {
  const { t } = useTranslation()
  const [autopopulateDialogVisible, setAutopopulateDialogVisible] =
    useState(false)
  const [pendingFunctionId, setPendingFunctionId] = useState('')

  const isEnabled = tool.enabled !== false
  const nameInvalid =
    isEnabled &&
    tool.name.trim().length > 0 &&
    !MCP_TOOL_NAME_PATTERN.test(tool.name.trim())

  const selectedFunction = useMemo(
    () => functions.find((fn) => fn.id === pendingFunctionId),
    [functions, pendingFunctionId]
  )

  const assistantContext = useMemo(
    () => ({
      functionId: pendingFunctionId.trim(),
      functionName: selectedFunction?.name,
      runtime: selectedFunction?.runtime,
    }),
    [pendingFunctionId, selectedFunction]
  )

  const availableScopeIds = useMemo(
    () => (scopesLoading ? undefined : scopes.map((scope) => scope.id)),
    [scopes, scopesLoading]
  )

  const toolForAssistant = useMemo(
    () => ({
      ...tool,
      config: {
        requiredScopes: tool.config?.requiredScopes ?? [],
        inputSchema: tool.config?.inputSchema ?? '',
        invocation: {
          functionId:
            pendingFunctionId.trim() ||
            tool.config?.invocation?.functionId ||
            '',
          method:
            tool.config?.invocation?.method ?? McpToolInvocationMethod.POST,
          argsLocation: tool.config?.invocation?.argsLocation,
        },
      },
    }),
    [pendingFunctionId, tool]
  )

  const updateTool = (patch: Partial<McpTool>) => {
    onChange({ ...tool, ...patch })
  }

  const updateConfig = (patch: Partial<NonNullable<McpTool['config']>>) => {
    onChange({
      ...tool,
      config: {
        requiredScopes: tool.config?.requiredScopes ?? [],
        inputSchema: tool.config?.inputSchema ?? '',
        invocation: tool.config?.invocation ?? {
          functionId: '',
          method: McpToolInvocationMethod.POST,
        },
        ...patch,
      },
    })
  }

  const handleFunctionIdChange = (functionId: string) => {
    updateConfig({
      invocation: {
        ...(tool.config?.invocation ?? {
          method: McpToolInvocationMethod.POST,
          functionId: '',
        }),
        functionId,
      },
    })
  }

  const handleFunctionSelected = (functionId: string) => {
    const trimmed = functionId.trim()
    handleFunctionIdChange(functionId)
    if (trimmed) {
      setPendingFunctionId(trimmed)
      setAutopopulateDialogVisible(true)
    }
  }

  const handleAutopopulateApply = (generatedTool: McpTool) => {
    onChange(generatedTool)
    setAutopopulateDialogVisible(false)
  }

  return (
    <div className="mcp-tool-form">
      <McpToolInvocationSection
        functionId={tool.config?.invocation?.functionId ?? ''}
        method={tool.config?.invocation?.method ?? McpToolInvocationMethod.POST}
        argsLocation={tool.config?.invocation?.argsLocation}
        functions={functions}
        functionsLoading={functionsLoading}
        functionsLoadError={functionsLoadError}
        featureDisabled={featureDisabled}
        required={isEnabled}
        onRefreshFunctions={onRefreshFunctions}
        onFunctionIdChange={handleFunctionIdChange}
        onFunctionSelected={handleFunctionSelected}
        onMethodChange={(method) =>
          updateConfig({
            invocation: {
              ...(tool.config?.invocation ?? {
                functionId: '',
                method: McpToolInvocationMethod.POST,
              }),
              method,
            },
          })
        }
        onArgsLocationChange={(argsLocation) =>
          updateConfig({
            invocation: {
              ...(tool.config?.invocation ?? {
                functionId: '',
                method: McpToolInvocationMethod.POST,
              }),
              argsLocation,
            },
          })
        }
      />

      <div className="mcp-tool-form-identity">
        <div className="mcp-tool-form-identity-left">
          <div className="form-field">
            <label className="field-label">
              {t('mcp_tool_name')}
              <McpRequiredMark />
            </label>
            <InputText
              value={tool.name}
              onChange={(event) => updateTool({ name: event.target.value })}
              className={`w-full${isEnabled && (nameInvalid || !tool.name.trim()) ? ' p-invalid' : ''}`}
              placeholder={t('mcp_tool_name_placeholder')}
            />
            {nameInvalid ? (
              <small className="p-error">
                {t('mcp_tool_name_no_whitespace')}
              </small>
            ) : null}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('description')} ({t('optional')})
            </label>
            <InputTextarea
              value={tool.description ?? ''}
              onChange={(event) =>
                updateTool({ description: event.target.value })
              }
              rows={3}
              className="w-full"
              placeholder={t('mcp_tool_description_placeholder')}
            />
          </div>
        </div>

        <div className="form-field mcp-tool-form-prompt">
          <label className="field-label">
            {t('mcp_tool_prompt')}
            <McpRequiredMark />
          </label>
          <InputTextarea
            value={tool.prompt ?? ''}
            onChange={(event) => updateTool({ prompt: event.target.value })}
            className={`w-full mcp-tool-form-prompt-input${isEnabled && !tool.prompt?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('mcp_tool_prompt_placeholder')}
          />
        </div>
      </div>

      <McpToolInputSchemaField
        value={tool.config?.inputSchema ?? ''}
        onChange={(inputSchema) => updateConfig({ inputSchema })}
        required={isEnabled}
      />

      <McpToolRequiredScopesField
        value={tool.config?.requiredScopes ?? []}
        scopes={scopes}
        scopesLoading={scopesLoading}
        scopesLoadError={scopesLoadError}
        onChange={(requiredScopes) => updateConfig({ requiredScopes })}
      />

      <GenerateMcpToolFromFunctionDialog
        visible={autopopulateDialogVisible}
        tool={toolForAssistant}
        context={assistantContext}
        availableScopeIds={availableScopeIds}
        onHide={() => setAutopopulateDialogVisible(false)}
        onApply={handleAutopopulateApply}
      />
    </div>
  )
}
