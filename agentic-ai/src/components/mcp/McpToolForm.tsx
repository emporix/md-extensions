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

interface McpToolFormProps {
  tool: McpTool
  functions: ProjectCloudFunction[]
  functionsLoading: boolean
  functionsLoadError?: string | null
  featureDisabled: boolean
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
  scopes,
  scopesLoading,
  scopesLoadError,
  onChange,
}: McpToolFormProps) => {
  const { t } = useTranslation()
  const nameInvalid =
    tool.name.trim().length > 0 && !MCP_TOOL_NAME_PATTERN.test(tool.name.trim())

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

  return (
    <div className="mcp-tool-form">
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
              className={`w-full${nameInvalid || !tool.name.trim() ? ' p-invalid' : ''}`}
              placeholder={t('mcp_tool_name_placeholder')}
            />
            {nameInvalid ? (
              <small className="p-error">{t('mcp_tool_name_no_whitespace')}</small>
            ) : null}
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('description')} ({t('optional')})
            </label>
            <InputTextarea
              value={tool.description ?? ''}
              onChange={(event) => updateTool({ description: event.target.value })}
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
            className={`w-full mcp-tool-form-prompt-input${!tool.prompt?.trim() ? ' p-invalid' : ''}`}
            placeholder={t('mcp_tool_prompt_placeholder')}
          />
        </div>
      </div>

      <McpToolInvocationSection
        functionId={tool.config?.invocation?.functionId ?? ''}
        method={tool.config?.invocation?.method ?? McpToolInvocationMethod.POST}
        argsLocation={tool.config?.invocation?.argsLocation}
        functions={functions}
        functionsLoading={functionsLoading}
        functionsLoadError={functionsLoadError}
        featureDisabled={featureDisabled}
        onFunctionIdChange={(functionId) =>
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

      <McpToolInputSchemaField
        value={tool.config?.inputSchema ?? ''}
        onChange={(inputSchema) => updateConfig({ inputSchema })}
      />

      <McpToolRequiredScopesField
        value={tool.config?.requiredScopes ?? []}
        scopes={scopes}
        scopesLoading={scopesLoading}
        scopesLoadError={scopesLoadError}
        onChange={(requiredScopes) => updateConfig({ requiredScopes })}
      />
    </div>
  )
}
