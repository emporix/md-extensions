import React, { useState, useCallback, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';

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
  badge?: string | string[];
  title: string;
  description: string | React.ReactNode;
  enabled?: boolean;
  actions?: CardAction[];
  onToggleActive?: (id: string, enabled: boolean) => void | Promise<void>;
  onClick?: () => void;
  switchDisabled?: boolean;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  contentBadges?: React.ReactNode;
  showStatusDot?: boolean;
}

const BaseCard: React.FC<BaseCardProps> = ({
  id,
  className = 'custom-agent-card',
  icon,
  badge,
  title,
  description,
  enabled = false,
  actions = [],
  onToggleActive,
  onClick,
  switchDisabled = false,
  children,
  headerContent,
  contentBadges,
  showStatusDot = false
}) => {
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

  const renderBadge = () => {
    if (!badge) return null;
    
    if (Array.isArray(badge)) {
      return badge.map((b, idx) => (
        <Badge value={b} key={idx} className="agent-tag-badge" />
      ));
    }
    
    return <Badge value={badge} className="agent-tag-badge" />;
  };

  const cardHeader = (
    <div className="custom-agent-card-header">
      <div className="card-header-left">
        <div className="agent-icon">
          {icon}
        </div>
        {headerContent && <div className="header-content-wrapper">{headerContent}</div>}
      </div>
      {(onToggleActive || showStatusDot) && (
        <div className="card-header-right" onClick={(e) => e.stopPropagation()}>
          {showStatusDot ? (
            <div className="status-dot-indicator">
              <span className={`status-dot ${isActive ? 'status-dot-active' : 'status-dot-inactive'}`}></span>
              <span className="status-label">{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          ) : (
            <div className="switch-with-label">
              <InputSwitch 
                checked={isActive}
                onChange={(e) => handleToggleActive(e.value)}
                className="agent-switch"
                disabled={isToggling || switchDisabled}
              />
              <span className="switch-label">{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const cardFooter = (
    <div className="custom-agent-card-footer">
      {children && (
        <div className="card-children-wrapper">
          {children}
        </div>
      )}
      
      <div className="card-actions-row">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`text-button ${action.className || ''}`}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(e);
            }}
            disabled={action.disabled}
            title={action.title}
          >
            {action.icon && <i className={action.icon}></i>}
            {action.className !== 'remove-button' && action.className !== 'export-button' && action.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card
      className={`${className} ${onClick ? 'clickable-card' : ''}`}
      header={cardHeader}
      footer={cardFooter}
      onClick={onClick}
    >
      <div className="agent-content">
        <h3 className="agent-name">{title}</h3>
        <p className="agent-description">{description}</p>
        <div className="agent-tags">
          {contentBadges || renderBadge()}
        </div>
      </div>
    </Card>
  );
};

export default BaseCard;
