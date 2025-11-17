import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { ConfirmDialog } from './ConfirmDialog';

interface BasePageProps {
  loading: boolean;
  error: string | null;
  title: React.ReactNode;
  addButtonLabel?: string;
  onAdd?: () => void;
  backButtonLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;

  // Import button props
  importButtonIcon?: string;
  onImport?: () => void;
  importButtonTitle?: string;

  // Delete confirmation props
  deleteConfirmVisible?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  onDeleteConfirm?: () => void;
  onDeleteCancel?: () => void;

  className?: string;
  maxWidth?: string;
}

export const BasePage: React.FC<BasePageProps> = ({
  loading,
  error,
  title,
  addButtonLabel,
  onAdd,
  children,
  importButtonIcon,
  onImport,
  importButtonTitle,
  deleteConfirmVisible = false,
  deleteConfirmTitle,
  deleteConfirmMessage,
  onDeleteConfirm,
  onDeleteCancel,
  className = ''
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        className={`${className}-page p-6`}
      >
        <div className="flex justify-center items-center min-h-[200px]">
          <ProgressSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${className}-page p-6`}
      >
        <Message severity="error" text={error} />
      </div>
    );
  }

  return (
    <div className={`${className}-page`} style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onImport && importButtonIcon && (
            <button
              className="import-action-button"
              onClick={onImport}
              title={importButtonTitle}
              aria-label={importButtonTitle}
            >
              <i className={importButtonIcon}></i>
            </button>
          )}
          {onAdd && addButtonLabel && (
            <Button
              label={addButtonLabel}
              icon="pi pi-plus"
              className="p-button-primary add-new-agent-button"
              onClick={onAdd}
            />
          )}
        </div>
      </div>

      {children}

      {deleteConfirmVisible && onDeleteConfirm && onDeleteCancel && (
        <ConfirmDialog
          visible={deleteConfirmVisible}
          title={deleteConfirmTitle || t('confirm_delete', 'Confirm Delete')}
          message={deleteConfirmMessage || t('are_you_sure_delete', 'Are you sure you want to delete this item?')}
          onConfirm={onDeleteConfirm}
          onHide={onDeleteCancel}
        />
      )}
    </div>
  );
};

export default BasePage;
