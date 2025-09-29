import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TokenCard from './TokenCard';
import TokenConfigPanel from './TokenConfigPanel';
import { BasePage } from '../shared/BasePage';
import { Token } from '../../types/Token';
import { useTokens } from '../../hooks/useTokens';
import { AppState } from '../../types/common';
import { createEmptyToken } from '../../utils/tokenHelpers';
import { useToast } from '../../contexts/ToastContext';

interface TokensPageProps {
  appState?: AppState;
}

const TokensPage: React.FC<TokensPageProps> = ({ 
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
  }
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const { 
    tokens, 
    loading, 
    error, 
    upsertToken, 
    refreshTokens,
    removeToken, 
    deleteConfirmVisible, 
    hideDeleteConfirm, 
    confirmDelete 
  } = useTokens(appState);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleConfigure = (token: Token) => {
    setSelectedToken(token);
    setShowConfigPanel(true);
  };

  const handleAddNewToken = useCallback(() => {
    setSelectedToken(createEmptyToken());
    setShowConfigPanel(true);
  }, []);

  const handleConfigSave = async (updatedToken: Token) => {
    try {
      await upsertToken(updatedToken);
      await refreshTokens();
      showSuccess(t('token_updated_successfully', 'Token updated successfully!'));
      setShowConfigPanel(false);
      setSelectedToken(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save token';
      showError(`${t('error_saving_token', 'Error saving token')}: ${errorMessage}`);
    }
  };

  const handleConfigClose = () => {
    setShowConfigPanel(false);
    setSelectedToken(null);
  };

  return (
    <BasePage
      loading={loading}
      error={error}
      title={t('tokens', 'Tokens')}
      addButtonLabel={t('add_new_token', 'ADD NEW TOKEN')}
      onAdd={handleAddNewToken}
      deleteConfirmVisible={deleteConfirmVisible}
      deleteConfirmTitle={t('delete_token', 'Delete Token')}
      deleteConfirmMessage={t('delete_token_confirmation', 'Are you sure you want to delete this token? This action cannot be undone.')}
      onDeleteConfirm={confirmDelete}
      onDeleteCancel={hideDeleteConfirm}
      className="tokens"
    >
      {tokens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>{t('no_tokens', 'No tokens available')}</p>
        </div>
      ) : (
        <div className="agents-grid">
          {tokens.map((token) => (
            <TokenCard 
              key={token.id} 
              token={token} 
              onConfigure={handleConfigure}
              onRemove={removeToken}
            />
          ))}
        </div>
      )}

      <TokenConfigPanel
        visible={showConfigPanel}
        token={selectedToken}
        onHide={handleConfigClose}
        onSave={handleConfigSave}
      />
    </BasePage>
  );
};

export default TokensPage;
