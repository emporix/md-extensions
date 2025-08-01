import React, { memo } from 'react';

interface MemoizedFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const MemoizedFormField: React.FC<MemoizedFormFieldProps> = memo(({ 
  label, 
  required = false, 
  error, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`form-field ${className}`}>
      <label className="field-label">
        {label} {required && '*'}
      </label>
      {children}
      {error && (
        <small className="p-error">{error}</small>
      )}
    </div>
  );
});

MemoizedFormField.displayName = 'MemoizedFormField'; 