import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import type { TokenConfigField } from '../../hooks/useTokenConfig'
import { TokenRequiredMark } from './TokenRequiredMark'

interface TokenGeneralSectionProps {
  tokenId: string
  tokenName: string
  tokenValue: string
  isEditing: boolean
  onFieldChange: (field: TokenConfigField, value: string) => void
}

export const TokenGeneralSection: React.FC<TokenGeneralSectionProps> = ({
  tokenId,
  tokenName,
  tokenValue,
  isEditing,
  onFieldChange,
}) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="token-detail-form-row">
        <div className="form-field">
          <label className="field-label">
            {t('token_id')}
            {!isEditing && <TokenRequiredMark />}
          </label>
          <InputText
            value={tokenId}
            onChange={(event) => onFieldChange('tokenId', event.target.value)}
            className={`w-full${!isEditing && !tokenId.trim() ? ' p-invalid' : ''}`}
            disabled={isEditing}
            placeholder={t('enter_token_id')}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            {t('token_name')}
            <TokenRequiredMark />
          </label>
          <InputText
            value={tokenName}
            onChange={(event) => onFieldChange('tokenName', event.target.value)}
            className={`w-full${!tokenName.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_token_name')}
          />
        </div>
      </div>

      {!isEditing && (
        <div className="form-field token-detail-form-field-half">
          <label className="field-label">
            {t('token_value')}
            <TokenRequiredMark />
          </label>
          <Password
            value={tokenValue}
            onChange={(event) =>
              onFieldChange('tokenValue', event.target.value)
            }
            className={`w-full${!tokenValue.trim() ? ' p-invalid' : ''}`}
            placeholder={t('enter_token_value')}
            feedback={false}
            toggleMask
          />
        </div>
      )}
    </>
  )
}
