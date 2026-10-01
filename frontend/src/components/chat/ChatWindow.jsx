import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

export const ChatWindow = ({ onBack, onSaveContact }) => {
  const { activeConversation, messages, isTypingMap, sendMessage, sendTyping } = useChat();
  const { user } = useAuth();

  if (!activeConversation) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '48px', marginBottom: '12px' }}>💬</span>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>ChatConnect App</h3>
        <p style={{ fontSize: '13px' }}>Select a chat or contact to start messaging</p>
      </div>
    );
  }

  const isOtherUserTyping = !!isTypingMap[activeConversation.id];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      <ChatHeader
        conversation={activeConversation}
        isTyping={isOtherUserTyping}
        onBack={onBack}
        onSaveContact={onSaveContact}
      />
      <MessageList messages={messages} currentUserId={user?.id} />
      <TypingIndicator
        isTyping={isOtherUserTyping}
        userName={activeConversation.other_user?.name || 'Someone'}
      />
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={(isTyping) => sendTyping(isTyping)}
      />
    </div>
  );
};
