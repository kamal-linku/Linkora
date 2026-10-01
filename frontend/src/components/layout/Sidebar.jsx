import React from 'react';
import { Avatar } from '../common/Avatar';
import { formatChatSnippetTime } from '../../utils/formatTime';

export const Sidebar = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-sub)' }}>
          CHATS ({conversations.length})
        </span>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '14px' }}
          >
            + New
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            No active chats yet.<br />Tap Search to find people and start messaging!
          </div>
        ) : (
          conversations.map((conv) => {
            const displayName =
              conv.saved_name ||
              (conv.other_user ? conv.other_user.name : 'Chat') ||
              (conv.other_user ? conv.other_user.phone_number : 'Chat');

            const isOnline = conv.other_user && conv.other_user.is_online;
            const lastMsg = conv.last_message;
            const time = lastMsg ? formatChatSnippetTime(lastMsg.created_at) : '';
            const isActive = activeId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-light)',
                  background: isActive ? 'rgba(37, 211, 102, 0.08)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--accent-green)' : '4px solid transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <Avatar
                  name={displayName}
                  photo={conv.other_user?.profile_photo}
                  isOnline={isOnline}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{time}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: conv.unread_count > 0 ? 'var(--text-main)' : 'var(--text-sub)',
                        fontWeight: conv.unread_count > 0 ? '600' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '220px',
                      }}
                    >
                      {lastMsg ? lastMsg.content : 'Tap to open chat'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="badge-count" style={{ position: 'static' }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
