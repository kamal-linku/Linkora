import React from 'react';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  autoFocus = false,
  maxLength,
  className = '',
  id,
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className="input-control"
      />
      {error && <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '4px' }}>{error}</span>}
    </div>
  );
};
