import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MultiSelect } from 'primereact/multiselect'
import { Message } from 'primereact/message'
import { IamScope } from '../../services/iamScopesService'

interface McpToolRequiredScopesFieldProps {
  value: string[]
  scopes: IamScope[]
  scopesLoading: boolean
  scopesLoadError?: string | null
  onChange: (value: string[]) => void
}

export const McpToolRequiredScopesField = ({
  value,
  scopes,
  scopesLoading,
  scopesLoadError,
  onChange,
}: McpToolRequiredScopesFieldProps) => {
  const { t } = useTranslation()

  const scopeOptions = useMemo(() => {
    const catalogIds = new Set(scopes.map((scope) => scope.id))
    const selectedOptions = value
      .filter((scopeId) => scopeId.trim() && !catalogIds.has(scopeId))
      .map((scopeId) => ({ label: scopeId, value: scopeId }))
    const catalogOptions = scopes.map((scope) => ({
      label: scope.id,
      value: scope.id,
    }))

    return [...selectedOptions, ...catalogOptions]
  }, [scopes, value])

  return (
    <div className="form-field">
      <label className="field-label">
        {t('mcp_tool_required_scopes')} ({t('optional')})
      </label>
      {scopesLoadError ? (
        <Message severity="warn" text={scopesLoadError} />
      ) : null}
      <MultiSelect
        value={value}
        options={scopeOptions}
        onChange={(event) => onChange((event.value as string[]) ?? [])}
        className="w-full"
        display="chip"
        filter
        placeholder={t('select_required_scopes')}
        appendTo="self"
        disabled={scopesLoading}
      />
    </div>
  )
}
