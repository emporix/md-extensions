import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { CustomMcpServerTransportType } from '../../types/Mcp'
import { Token } from '../../types/Token'
import type { McpConfigField } from '../../hooks/useMcpConfig'
import { getMcpTransportOptions } from '../../utils/mcpHelpers'
import { McpAuthTokenSelect } from './McpAuthTokenSelect'
import { McpRequiredMark } from './McpRequiredMark'

interface McpConnectionSectionProps {
  url: string
  transport: CustomMcpServerTransportType
  authorizationHeaderName: string
  authorizationHeaderToken: string
  tokens: Token[]
  tokensLoading: boolean
  onFieldChange: (
    field: McpConfigField,
    value: string | CustomMcpServerTransportType
  ) => void
}

export const McpConnectionSection: React.FC<McpConnectionSectionProps> = ({
  url,
  transport,
  authorizationHeaderName,
  authorizationHeaderToken,
  tokens,
  tokensLoading,
  onFieldChange,
}) => {
  const { t } = useTranslation()
  const transportOptions = useMemo(() => getMcpTransportOptions(t), [t])

  return (
    <>
      <div className="mcp-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('url')}
            <McpRequiredMark />
          </label>
          <InputText
            value={url}
            onChange={(event) => onFieldChange('url', event.target.value)}
            className={`w-full${!url.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_url')}
          />
        </div>

        <div className="form-field">
          <label className="field-label">{t('transport')}</label>
          <Dropdown
            value={transport}
            options={transportOptions}
            onChange={(event) => onFieldChange('transport', event.value)}
            className="w-full"
            placeholder={t('select_transport')}
            appendTo="self"
          />
        </div>
      </div>

      <div className="mcp-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('authorization_header_name')} ({t('optional')})
          </label>
          <InputText
            value={authorizationHeaderName}
            onChange={(event) =>
              onFieldChange('authorizationHeaderName', event.target.value)
            }
            className="w-full"
            placeholder={t('enter_authorization_header_name')}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('authorization_header_token_id')} ({t('optional')})
          </label>
          <McpAuthTokenSelect
            value={authorizationHeaderToken}
            tokens={tokens}
            tokensLoading={tokensLoading}
            onChange={(tokenId) =>
              onFieldChange('authorizationHeaderToken', tokenId)
            }
          />
        </div>
      </div>
    </>
  )
}
