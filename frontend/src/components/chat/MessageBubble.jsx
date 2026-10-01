import React from 'react';
import { formatMessageTime } from '../../utils/formatTime';

export const MessageBubble = ({ message, isOutgoing }) => {
  const time = formatMessageTime(message.created_at);

  let tickContent = '✓';
  let tickClass = 'tick-sent';

  if (isOutgoing) {
    if (message.read_at) {
      tickContent = '✓✓';
      tickClass = 'tick-read';
    } else if (message.delivered_at) {
      tickContent = '✓✓';
      tickClass = 'tick-delivered';
    }
  }

  return (
    <div className={`chat-bubble ${isOutgoing ? 'out' : 'in'}`}>
      <div style={{ wordBreak: 'break-word', userSelect: 'text' }}>{message.content}</div>
      <div className="chat-bubble-meta">
        <span>{time}</span>
        {isOutgoing && (
          <span className={tickClass} style={{ fontSize: '13px', marginLeft: '2px' }}>
            {tickContent}
          </span>
        )}
      </div>
    </div>
  );
};
