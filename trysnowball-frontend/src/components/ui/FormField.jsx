import React from 'react';
import clsx from 'clsx';

const FormField = ({ 
  children,
  label,
  hint,
  error,
  required = false,
  className = '',
  id,
  ...props 
}) => {
  // Generate unique ID if not provided
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('space-y-1', className)} {...props}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium"
          style={{ color: 'var(--form-label-text)' }}
        >
          {label}
          {required && (
            <span 
              className="ml-1"
              style={{ color: 'var(--form-label-text-required)' }}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Form Field */}
      <div className="relative">
        {React.cloneElement(children, {
          id: fieldId,
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': clsx(
            hint && `${fieldId}-hint`,
            error && `${fieldId}-error`
          ).trim() || undefined
        })}
      </div>

      {/* Hint Text */}
      {hint && !error && (
        <p 
          id={`${fieldId}-hint`}
          className="text-xs"
          style={{ color: 'var(--form-hint-text)' }}
        >
          {hint}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p 
          id={`${fieldId}-error`}
          className="text-xs"
          style={{ color: 'var(--form-error-text)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;