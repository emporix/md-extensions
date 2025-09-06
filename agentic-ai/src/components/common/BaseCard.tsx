import React from 'react';
import { Card } from 'primereact/card';

export interface CardAction {
  icon?: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export interface BaseCardProps {
  className?: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string | React.ReactNode;
  primaryActions?: CardAction[];
  secondaryActions?: CardAction[];
  onClick?: () => void;
  children?: React.ReactNode;
}

const BaseCard: React.FC<BaseCardProps> = ({
  className = 'custom-agent-card',
  icon,
  badge,
  title,
  description,
  primaryActions = [],
  secondaryActions = [],
  onClick,
  children
}) => {

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
      
      {secondaryActions.length > 0 && (
        <div className="bottom-row">
          {children && (
            <div style={{ flex: 1 }}>
              {children}
            </div>
          )}
          {!children && <div style={{ flex: 1 }}></div>}
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
      )}
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
