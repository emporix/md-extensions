import React from 'react'

type RagFieldRowLayoutProps = {
  primaryField: React.ReactNode
  secondaryField: React.ReactNode
  onRemove: () => void
  removeAriaLabel: string
  footer?: React.ReactNode
}

const RagFieldRowLayout: React.FC<RagFieldRowLayoutProps> = ({
  primaryField,
  secondaryField,
  onRemove,
  removeAriaLabel,
  footer,
}) => (
  <div className="tool-detail-field-row">
    <div className="tool-detail-field-row-fields">
      <div className="form-field">{primaryField}</div>
      <div className="form-field">{secondaryField}</div>
      {footer && (
        <div className="form-field tool-detail-field-row-footer">{footer}</div>
      )}
    </div>
    <div className="tool-detail-field-row-actions">
      <button
        type="button"
        className="tool-detail-field-row-action-btn tool-detail-field-row-action-btn--delete"
        aria-label={removeAriaLabel}
        onClick={onRemove}
      >
        <i className="pi pi-trash" />
      </button>
    </div>
  </div>
)

export default RagFieldRowLayout
