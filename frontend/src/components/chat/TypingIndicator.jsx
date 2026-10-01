import React from 'react';

export const TypingIndicator = ({ isTyping, userName = 'typing' }) => {
  if (!isTyping) return null;

  return (
    <div
      style={{
        padding: '4px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12.5px',
        color: 'var(--text-sub)',
      }}
    >
      <div
        style={{
          background: 'var(--bubble-incoming)',
          padding: '6px 12px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{userName} is typing</span>
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
};
