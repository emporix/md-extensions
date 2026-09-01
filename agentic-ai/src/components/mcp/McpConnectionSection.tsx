import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Token } from '../../types/Token'
import type { McpConfigField } from '../../hooks/useMcpConfig'
import { McpAuthTokenSelect } from './McpAuthTokenSelect'
import { McpRequiredMark } from './McpRequiredMark'

interface McpConnectionSectionProps {
  url: string
  authorizationHeaderName: string
  authorizationHeaderToken: string
  tokens: Token[]
  tokensLoading: boolean
  onFieldChange: (field: McpConfigField, value: string) => void
}

export const McpConnectionSection = ({
  url,
  authorizationHeaderName,
  authorizationHeaderToken,
  tokens,
  tokensLoading,
  onFieldChange,
}: McpConnectionSectionProps) => {
  const { t } = useTranslation()

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
