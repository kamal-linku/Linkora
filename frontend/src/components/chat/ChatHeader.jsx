import React from 'react';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../utils/formatTime';

export const ChatHeader = ({ conversation, isTyping, onBack, onSaveContact }) => {
  if (!conversation) return null;

  const otherUser = conversation.other_user;
  const displayName =
    conversation.saved_name ||
    (otherUser ? otherUser.name : 'Chat') ||
    (otherUser ? otherUser.phone_number : 'Chat');

  const isOnline = otherUser && otherUser.is_online;

  let statusText = 'offline';
  let isTypingActive = false;

  if (isTyping) {
    statusText = 'typing...';
    isTypingActive = true;
  } else if (isOnline) {
    statusText = 'online';
  } else if (otherUser && otherUser.last_seen) {
    statusText = formatLastSeen(otherUser.last_seen);
  }

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onBack && (
          <button className="btn-icon" onClick={onBack} title="Back">
            ←
          </button>
        )}
        <Avatar
          name={displayName}
          photo={otherUser?.profile_photo}
          isOnline={isOnline}
          size={38}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
            {displayName}
          </span>
          <span
            style={{
              fontSize: '11.5px',
              color: isTypingActive || isOnline ? 'var(--accent-green)' : 'var(--text-muted)',
              fontStyle: isTypingActive ? 'italic' : 'normal',
              fontWeight: isTypingActive || isOnline ? '600' : 'normal',
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {onSaveContact && !conversation.saved_name && (
          <button className="btn-icon" onClick={onSaveContact} title="Add to Contacts">
            ⭐
          </button>
        )}
      </div>
    </header>
  );
};
