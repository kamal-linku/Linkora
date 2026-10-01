import React, { useRef } from 'react';

export const OTPInput = ({ value, onChange, length = 6, disabled = false }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      // Clear current digit
      const nextOtp = value.substring(0, index) + ' ' + value.substring(index + 1);
      onChange(nextOtp.trim());
      return;
    }

    // Single digit or paste
    const char = val[val.length - 1];
    const otpArr = value.split('');
    while (otpArr.length < length) otpArr.push('');
    otpArr[index] = char;
    const newOtp = otpArr.join('').slice(0, length);
    onChange(newOtp);

    // Auto advance focus
    if (index < length - 1 && char) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        margin: '16px 0',
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          disabled={disabled}
          style={{
            width: '46px',
            height: '52px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: '700',
            background: 'var(--surface-input)',
            border: '1.5px solid var(--border-light)',
            borderRadius: '12px',
            color: 'var(--text-main)',
            outline: 'none',
          }}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
};
