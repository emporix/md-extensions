import React from 'react'
import { Button } from 'primereact/button'

type RagFieldRowLayoutProps = {
  primaryField?: React.ReactNode
  secondaryField: React.ReactNode
  onRemove: () => void
  footer?: React.ReactNode
  primaryClassName?: string
  secondaryClassName?: string
  removeAriaLabel?: string
  removeTooltip?: string
}

const RagFieldRowLayout: React.FC<RagFieldRowLayoutProps> = ({
  primaryField,
  secondaryField,
  onRemove,
  footer,
  primaryClassName = 'tool-field-row__primary',
  secondaryClassName = 'tool-field-row__secondary',
  removeAriaLabel = 'Remove field',
  removeTooltip,
}) => (
  <div className="rag-field-group">
    <div className="tool-field-row">
      {primaryField !== undefined && (
        <div className={`form-field ${primaryClassName}`}>{primaryField}</div>
      )}
      <div className={`form-field ${secondaryClassName}`}>{secondaryField}</div>
      <div className="indexed-field-delete-button">
        <Button
          icon="pi pi-trash"
          className="p-button-danger"
          onClick={onRemove}
          aria-label={removeAriaLabel}
          tooltip={removeTooltip}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    </div>
    {footer}
  </div>
)

export default RagFieldRowLayout
