import React, { useState, useCallback, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import { useTranslation } from 'react-i18next';

export interface CardAction {
  icon?: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export interface BaseCardProps {
  id?: string;
  className?: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string | React.ReactNode;
  enabled?: boolean;
  primaryActions?: CardAction[];
  secondaryActions?: CardAction[];
  onToggleActive?: (id: string, enabled: boolean) => void | Promise<void>;
  onClick?: () => void;
  children?: React.ReactNode;
}

const BaseCard: React.FC<BaseCardProps> = ({
  id,
  className = 'custom-agent-card',
  icon,
  badge,
  title,
  description,
  enabled = false,
  primaryActions = [],
  secondaryActions = [],
  onToggleActive,
  onClick,
  children
}) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(enabled);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsActive(enabled);
  }, [enabled]);

  const handleToggleActive = useCallback(async (newEnabled: boolean) => {
    if (!onToggleActive || !id) return;
    
    setIsToggling(true);
    try {
      setIsActive(newEnabled);
      await onToggleActive(id, newEnabled);
    } catch (error) {
      setIsActive(!newEnabled);
    } finally {
      setIsToggling(false);
    }
  }, [id, onToggleActive]);

  const getStatusLabel = (active: boolean) => {
    return active ? t('active', 'Active') : t('inactive', 'Inactive');
  };

  const cardHeader = (
    <div className="custom-agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="agent-icon">
        {icon}
      </div>
      <div className="agent-tags">
        {badge && <span className="tool-type-badge">{badge}</span>}
      </div>
    </div>
  );

  const cardFooter = (
    <div className="custom-agent-card-footer">
      {primaryActions.length > 0 && (
        <div className="top-row">
          {primaryActions.map((action, index) => (
            <button
              key={index}
              className={`text-button ${action.className || 'configure-button'}`}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(e);
              }}
              disabled={action.disabled}
              title={action.title}
            >
              {action.icon && <i className={action.icon}></i>}
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      <div className="bottom-row">
        {onToggleActive && (
          <div className="status-toggle" onClick={(e) => e.stopPropagation()}>
            <InputSwitch 
              checked={isActive}
              onChange={(e) => handleToggleActive(e.value)}
              className="agent-switch"
              disabled={isToggling}
            />
            <span className="status-label">
              {isToggling ? t('updating', 'Updating...') : getStatusLabel(isActive)}
            </span>
          </div>
        )}
        
        {children && (
          <div style={{ flex: 1 }}>
            {children}
          </div>
        )}
        
        {!onToggleActive && !children && <div style={{ flex: 1 }}></div>}
        
        {secondaryActions.map((action, index) => (
          <button
            key={index}
            className={`text-button ${action.className || 'remove-button'}`}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(e);
            }}
            disabled={action.disabled}
            title={action.title}
          >
            {action.icon && <i className={action.icon}></i>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card
      className={className}
      header={cardHeader}
      footer={cardFooter}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="agent-content">
        <h3 className="agent-name">{title}</h3>
        <p className="agent-description">{description}</p>
      </div>
    </Card>
  );
};

export default BaseCard;
