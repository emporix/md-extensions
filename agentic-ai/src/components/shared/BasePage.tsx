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
  
  // Add button props
  addButtonLabel?: string;
  onAdd?: () => void;
  
  // Refresh button props
  refreshButtonLabel?: string;
  onRefresh?: () => void;
  
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
  refreshButtonLabel,
  onRefresh,
  backButtonLabel,
  onBack,
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

  const titleWithBackButton = onBack ? (
    <div className="details-title-with-back">
      <button 
        onClick={onBack}
        className="details-back-button"
        aria-label={backButtonLabel}
      >
        <i className="pi pi-arrow-left" />
      </button>
      <span className="details-title-text">{title}</span>
    </div>
  ) : title;

  return (
    <div className={`${className}-page base-page-container`}>
      <div className="base-page-header">
        <h1>{titleWithBackButton}</h1>
        <div className="base-page-actions">
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
          {onRefresh && refreshButtonLabel && (
            <Button
              label={refreshButtonLabel}
              icon="pi pi-refresh"
              onClick={onRefresh}
            />
          )}
          {onAdd && addButtonLabel && (
            <Button
              label={addButtonLabel}
              icon="pi pi-plus"
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
