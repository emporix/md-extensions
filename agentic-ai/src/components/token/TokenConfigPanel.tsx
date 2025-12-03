import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { TokenConfigPanelProps, Token } from '../../types/Token'
import { BaseConfigPanel } from '../shared/BaseConfigPanel'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import { sanitizeIdInput } from '../../utils/validation'

const TokenConfigPanel: React.FC<TokenConfigPanelProps> = ({
  visible,
  token,
  onHide,
  onSave,
}) => {
  const { t } = useTranslation()
  const [tokenId, setTokenId] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenValue, setTokenValue] = useState('')

  useEffect(() => {
    if (token) {
      setTokenId(token.id || '')
      setTokenName(token.name)
      setTokenValue(token.value || '')
    }
  }, [token])

  const handleSave = async () => {
    if (!token) return

    const updatedToken: Token = {
      ...token,
      id: tokenId,
      name: tokenName,
      // Only include value for new tokens (existing tokens can't update their value)
      ...(isExistingToken ? {} : { value: tokenValue }),
    }

    // Let the parent handle the save operation
    onSave(updatedToken)
  }

  // For existing tokens (with ID), we don't need token value to save (just name)
  // For new tokens (without ID), we need both token value and token ID
  const isExistingToken = !!token?.id
  const canSave =
    !!tokenName.trim() &&
    (isExistingToken || (!!tokenValue.trim() && !!tokenId.trim()))

  return (
    <BaseConfigPanel
      visible={visible}
      onHide={onHide}
      title={t('token_configuration', 'Token Configuration')}
      icon={faKey}
      iconName={tokenName}
      onSave={handleSave}
      canSave={canSave}
      className="token-config-panel"
    >
      <div className="form-field">
        <label className="field-label">
          {t('token_id', 'Token ID')}
          {!isExistingToken && <span style={{ color: 'red' }}> *</span>}
        </label>
        <InputText
          value={tokenId}
          onChange={(e) => setTokenId(sanitizeIdInput(e.target.value))}
          className={`w-full ${!isExistingToken && !tokenId.trim() ? 'p-invalid' : ''}`}
          disabled={!!token?.id}
          placeholder={t('enter_token_id', 'Enter token ID')}
        />
        {!isExistingToken && !tokenId.trim() && (
          <small className="p-error">
            {t('token_id_required', 'Token ID is required')}
          </small>
        )}
      </div>

      <div className="form-field">
        <label className="field-label">
          {t('token_name', 'Token Name')}
          <span style={{ color: 'red' }}> *</span>
        </label>
        <InputText
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          className={`w-full ${!tokenName.trim() ? 'p-invalid' : ''}`}
          placeholder={t('enter_token_name', 'Enter token name')}
        />
        {!tokenName.trim() && (
          <small className="p-error">
            {t('token_name_required', 'Token name is required')}
          </small>
        )}
      </div>

      {!isExistingToken && (
        <div className="form-field">
          <label className="field-label">
            {t('token_value', 'Token Value')}
            <span style={{ color: 'red' }}> *</span>
          </label>
          <Password
            value={tokenValue}
            onChange={(e) => setTokenValue(e.target.value)}
            className={`w-full ${!tokenValue.trim() ? 'p-invalid' : ''}`}
            placeholder={t('enter_token_value', 'Enter token value')}
            feedback={false}
            toggleMask
          />
          {!tokenValue.trim() && (
            <small className="p-error">
              {t('token_value_required', 'Token value is required')}
            </small>
          )}
        </div>
      )}
    </BaseConfigPanel>
  )
}

export default TokenConfigPanel
