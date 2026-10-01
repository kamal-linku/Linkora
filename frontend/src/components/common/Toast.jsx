import React from 'react';

export const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className="toast" onClick={onClose} style={{ cursor: 'pointer' }}>
        {type === 'error' && '⚠️ '}
        {type === 'success' && '✓ '}
        {message}
      </div>
    </div>
  );
};
