import React from 'react';

export const Loader = ({ message = 'Loading...', size = 32 }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '12px',
        color: 'var(--text-sub)',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {message && <span>{message}</span>}
    </div>
  );
};
