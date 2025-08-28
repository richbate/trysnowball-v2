import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({ 
  type = 'text',
  error = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseStyles = `
    w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:cursor-not-allowed
  `;

  // Use CSS variables for consistent theming
  const inputStyles = {
    backgroundColor: disabled ? 'var(--form-field-bg-disabled)' : 
                     error ? 'var(--form-field-bg-error)' : 'var(--form-field-bg)',
    borderColor: disabled ? 'var(--form-field-border-disabled)' :
                 error ? 'var(--form-field-border-error)' : 'var(--form-field-border)',
    color: disabled ? 'var(--form-field-text-disabled)' : 
           error ? 'var(--form-field-text-error)' : 'var(--form-field-text)',
    '--tw-ring-color': error ? 'var(--form-field-border-error)' : 'var(--form-field-border-focus)'
  };

  const placeholderStyles = `
    placeholder:opacity-100
  `;

  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={clsx(
        baseStyles,
        placeholderStyles,
        'hover:border-gray-400 dark:hover:border-gray-500',
        disabled && 'hover:border-gray-200 dark:hover:border-gray-700',
        className
      )}
      style={{
        ...inputStyles,
        '--tw-placeholder-color': 'var(--form-field-placeholder)'
      }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;