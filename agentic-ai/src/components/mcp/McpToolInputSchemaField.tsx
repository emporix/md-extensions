import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { Tooltip } from 'primereact/tooltip'
import starsIcon from '../../assets/stars_icon.svg'
import { JsonSchemaTextField } from '../shared/JsonSchemaTextField'
import { GenerateMcpToolInputSchemaDialog } from './GenerateMcpToolInputSchemaDialog'

interface McpToolInputSchemaFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  functionId: string
  toolName: string
  toolDescription?: string
  httpMethod: string
  argsLocation?: string
}

export const McpToolInputSchemaField = ({
  value,
  onChange,
  required = true,
  functionId,
  toolName,
  toolDescription,
  httpMethod,
  argsLocation,
}: McpToolInputSchemaFieldProps) => {
  const { t } = useTranslation()
  const [dialogVisible, setDialogVisible] = useState(false)
  const functionSelected = functionId.trim().length > 0
  const generateButtonId = useId()

  const assistantContext = useMemo(
    () => ({
      functionId: functionId.trim(),
      toolName,
      toolDescription,
      httpMethod,
      argsLocation,
    }),
    [argsLocation, functionId, httpMethod, toolDescription, toolName]
  )

  const generateButton = (
    <>
      <Tooltip
        target={`#${generateButtonId}`}
        content={t('mcp_tool_input_schema_generate_disabled_tooltip')}
        disabled={functionSelected}
      />
      <Button
        id={generateButtonId}
        type="button"
        className="p-button-outlined agent-detail-generate-json-schema-btn"
        disabled={!functionSelected}
        aria-disabled={!functionSelected}
        onClick={() => setDialogVisible(true)}
      >
        <span className="agent-detail-generate-json-schema-btn-content">
          <img
            src={starsIcon}
            alt=""
            className="agent-detail-generate-json-schema-btn-icon"
            aria-hidden="true"
          />
          <span className="p-button-label">{t('generate_json_schema')}</span>
        </span>
      </Button>
    </>
  )

  return (
    <>
      <JsonSchemaTextField
        value={value}
        onChange={onChange}
        labelKey="mcp_tool_input_schema"
        placeholderKey="mcp_tool_input_schema_placeholder"
        invalidJsonKey="mcp_tool_input_schema_invalid_json"
        invalidSchemaKey="mcp_tool_input_schema_invalid_schema"
        required={required}
        className="mcp-tool-input-schema-field"
        extraActions={generateButton}
      />
      <GenerateMcpToolInputSchemaDialog
        visible={dialogVisible}
        context={assistantContext}
        onHide={() => setDialogVisible(false)}
        onApply={onChange}
      />
    </>
  )
}
