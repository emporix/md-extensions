import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
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
}; 