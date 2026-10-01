import React from 'react';

export const PhoneInput = ({
  loginMode = 'email',
  onLoginModeChange,
  countryCode,
  onCountryCodeChange,
  identifier,
  onIdentifierChange,
  disabled = false,
}) => {
  return (
    <div className="form-group">
      {/* Mode Switcher */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface-input)',
          borderRadius: '12px',
          padding: '3px',
          marginBottom: '16px',
          border: '1px solid var(--border-light)',
        }}
      >
        <button
          type="button"
          onClick={() => onLoginModeChange('email')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: loginMode === 'email' ? 'var(--accent-green)' : 'transparent',
            color: loginMode === 'email' ? '#0b141a' : 'var(--text-sub)',
          }}
        >
          📧 Email Address
        </button>
        <button
          type="button"
          onClick={() => onLoginModeChange('phone')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: loginMode === 'phone' ? 'var(--accent-green)' : 'transparent',
            color: loginMode === 'phone' ? '#0b141a' : 'var(--text-sub)',
          }}
        >
          📱 Mobile SMS
        </button>
      </div>

      <label className="form-label" style={{ fontWeight: '600', fontSize: '13.5px', marginBottom: '8px', display: 'block' }}>
        {loginMode === 'email' ? 'Your Email Address' : 'Your Mobile Number'}
      </label>

      {loginMode === 'email' ? (
        <div style={{ position: 'relative' }}>
          <input
            type="email"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            placeholder="e.g. name@gmail.com"
            disabled={disabled}
            className="input-control"
            style={{
              paddingLeft: '40px',
              fontSize: '15px',
              width: '100%',
              boxSizing: 'border-box',
            }}
            autoComplete="email"
            autoFocus
          />
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '17px',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          >
            ✉️
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            disabled={disabled}
            style={{
              background: 'var(--surface-input)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '15px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="+91">🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+971">🇦🇪 +971</option>
            <option value="+61">🇦🇺 +61</option>
          </select>
          <input
            type="tel"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            placeholder="9876543210"
            disabled={disabled}
            className="input-control"
            style={{ flex: 1 }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
