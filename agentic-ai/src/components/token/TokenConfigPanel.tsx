import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { TokenConfigPanelProps, Token } from '../../types/Token';
import { BaseConfigPanel } from '../shared/BaseConfigPanel';
import { faKey } from '@fortawesome/free-solid-svg-icons';

const TokenConfigPanel: React.FC<TokenConfigPanelProps> = ({ 
  visible, 
  token, 
  onHide, 
  onSave 
}) => {
  const { t } = useTranslation();
  const [tokenId, setTokenId] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenValue, setTokenValue] = useState('');


  useEffect(() => {
    if (token) {
      setTokenId(token.id || '');
      setTokenName(token.name);
      setTokenValue(token.value || '');
    }
  }, [token]);

  const handleSave = async () => {
    if (!token) return;

    const updatedToken: Token = {
      ...token,
      id: tokenId,
      name: tokenName,
      value: tokenValue,
    };

    // Let the parent handle the save operation
    onSave(updatedToken);
  };

  const canSave = !!tokenName.trim() && !!tokenValue.trim() && (!!token?.id || !!tokenId.trim());

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
        <label className="field-label">{t('token_id', 'Token ID')}</label>
        <InputText
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full"
          disabled={!!token?.id}
          placeholder={t('enter_token_id', 'Enter token ID')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('token_name', 'Token Name')}</label>
        <InputText
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          className="w-full"
          placeholder={t('enter_token_name', 'Enter token name')}
        />
      </div>

      <div className="form-field">
        <label className="field-label">{t('token_value', 'Token Value')}</label>
        <Password
          value={tokenValue}
          onChange={(e) => setTokenValue(e.target.value)}
          className="w-full"
          placeholder={t('enter_token_value', 'Enter token value')}
          feedback={false}
          toggleMask
        />
      </div>
    </BaseConfigPanel>
  );
};

export default TokenConfigPanel;
