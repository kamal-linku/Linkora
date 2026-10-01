import React, { useState, useRef } from 'react';

export const MessageInput = ({ onSendMessage, onTyping }) => {
  const [content, setContent] = useState('');
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    setContent(e.target.value);

    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setContent('');

    if (onTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '10px 14px',
        background: 'var(--surface-header)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <input
        type="text"
        value={content}
        onChange={handleInputChange}
        placeholder="Type a message..."
        className="input-control"
        style={{
          borderRadius: '24px',
          padding: '10px 18px',
          fontSize: '14.5px',
        }}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="btn btn-primary"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          padding: 0,
          flexShrink: 0,
        }}
        title="Send"
      >
        ➤
      </button>
    </form>
  );
};
