import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export const MessageList = ({ messages, currentUserId }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '32px', marginBottom: '8px' }}>💬</span>
        <span>No messages yet. Send a message to start the conversation!</span>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOutgoing={msg.sender_id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
