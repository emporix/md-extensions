import { JsonSchemaTextField } from '../shared/JsonSchemaTextField'

interface McpToolInputSchemaFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export const McpToolInputSchemaField = ({
  value,
  onChange,
  required = true,
}: McpToolInputSchemaFieldProps) => {
  return (
    <JsonSchemaTextField
      value={value}
      onChange={onChange}
      labelKey="mcp_tool_input_schema"
      placeholderKey="mcp_tool_input_schema_placeholder"
      invalidJsonKey="mcp_tool_input_schema_invalid_json"
      invalidSchemaKey="mcp_tool_input_schema_invalid_schema"
      required={required}
      className="mcp-tool-input-schema-field"
    />
  )
}
