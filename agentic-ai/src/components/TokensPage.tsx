import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import TokenCard from './TokenCard';
import TokenConfigPanel from './TokenConfigPanel';
import { ConfirmDialog } from './common/ConfirmDialog';
import { Token } from '../types/Token';
import { useTokens } from '../hooks/useTokens';
import { AppState } from '../types/common';
import { createEmptyToken } from '../utils/tokenHelpers';
import { useToast } from '../contexts/ToastContext';

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
      showSuccess(t('token_updated_successfully', 'Token updated successfully!'));
      await refreshTokens();
      setShowConfigPanel(false);
      setSelectedToken(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save token';
      showError(`${t('error_saving_token', 'Error saving token')}: ${errorMessage}`);
      console.error('Error saving token:', error);
      setShowConfigPanel(false);
      setSelectedToken(null);
    }
  };

  const handleConfigClose = () => {
    setShowConfigPanel(false);
    setSelectedToken(null);
  };

  if (loading) {
    return (
      <div className="tokens-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <ProgressSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tokens-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Message severity="error" text={error} />
      </div>
    );
  }

  return (
    <div className="tokens-page" style={{ padding: '24px'}}>
      <div className="tokens-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 600, 
            color: '#111827', 
            margin: '0 0 8px 0' 
          }}>
            {t('tokens', 'Tokens')}
          </h1>
        </div>
        <Button
          label={t('add_new_token', 'ADD NEW TOKEN')}
          className="add-new-token-button"
          onClick={handleAddNewToken}
        />
      </div>

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

      <ConfirmDialog
        visible={deleteConfirmVisible}
        onHide={hideDeleteConfirm}
        onConfirm={confirmDelete}
        title={t('delete_token', 'Delete Token')}
        message={t('delete_token_confirmation', 'Are you sure you want to delete this token? This action cannot be undone.')}
        confirmLabel={t('delete', 'Delete')}
        cancelLabel={t('cancel', 'Cancel')}
        severity="danger"
      />
    </div>
  );
};

export default TokensPage;
