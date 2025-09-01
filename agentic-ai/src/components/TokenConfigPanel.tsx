import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { TokenConfigPanelProps, Token } from '../types/Token';
import { usePanelAnimation } from '../hooks/usePanelAnimation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  const { isVisible, isClosing, handleClose, handleBackdropClick } = usePanelAnimation({
    visible,
    onHide
  });

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

  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`agent-config-backdrop ${!isClosing ? 'backdrop-visible' : ''}`}
        onClick={handleBackdropClick} 
      />
      
      <div className="agent-config-panel token-config-panel">
        <div className="agent-config-header">
          <h2 className="panel-title">{t('token_configuration', 'Token Configuration')}</h2>
        </div>
        
        <div className="agent-config-content">
          <div className="agent-config-icon-row">
            <div className="agent-icon">
              <FontAwesomeIcon icon={faKey} />
            </div>
            <div className="agent-config-name-block">
              <h3 className="agent-config-name">{tokenName}</h3>
            </div>
          </div>

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

          <div className="panel-actions">
            <Button 
              label={t('cancel', 'Cancel')} 
              className="discard-button" 
              onClick={handleClose} 
            />
            <Button 
              label={t('save', 'Save')} 
              className="save-agent-button" 
              onClick={handleSave} 
              disabled={!tokenName.trim() || !tokenValue.trim() || (!token?.id && !tokenId.trim())} 
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenConfigPanel;
