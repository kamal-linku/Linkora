import React from 'react';
import { Avatar } from '../common/Avatar';

export const ContactItem = ({ contact, onMessage, onDelete }) => {
  const user = contact.contact_user;
  const displayName = contact.saved_name || user?.name || user?.phone_number;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar name={displayName} photo={user?.profile_photo} isOnline={user?.is_online} />
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {user?.phone_number || ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onMessage(contact.contact_user_id)}
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '18px' }}
        >
          Message
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(contact.id)}
            className="btn-icon"
            style={{ fontSize: '14px', color: 'var(--text-muted)' }}
            title="Delete Contact"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};
