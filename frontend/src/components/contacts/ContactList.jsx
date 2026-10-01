import React from 'react';
import { ContactItem } from './ContactItem';

export const ContactList = ({ contacts, onMessage, onDelete }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13.5px',
        }}
      >
        <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>👥</span>
        No contacts saved yet. Search for users to add them to your contacts!
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {contacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          onMessage={onMessage}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
