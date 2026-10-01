import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ContactList } from '../components/contacts/ContactList';
import { SearchUser } from '../components/contacts/SearchUser';
import { contactApi } from '../services/contactApi';
import { conversationApi } from '../services/conversationApi';
import { useChat } from '../hooks/useChat';

export const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'search'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { selectConversation, fetchConversations } = useChat();

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await contactApi.getContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleMessage = async (targetUserId) => {
    try {
      const conv = await conversationApi.createOrGetDirect(targetUserId);
      await fetchConversations();
      selectConversation(conv);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      alert(err.message || 'Failed to open conversation');
    }
  };

  const handleDelete = async (contactId) => {
    if (!confirm('Remove this contact from phonebook?')) return;
    try {
      await contactApi.deleteContact(contactId);
      loadContacts();
    } catch (err) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  const handleAddFromSearch = async (userId, initialName) => {
    const savedName = prompt('Enter a nickname for this contact:', initialName || '');
    if (!savedName) return;

    try {
      await contactApi.addContact(userId, savedName.trim());
      alert('Contact saved!');
      loadContacts();
      setActiveTab('saved');
    } catch (err) {
      alert(err.message || 'Failed to save contact');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Navbar title="Contacts Directory" />

      {/* Tab Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'var(--surface-header)' }}>
        <button
          onClick={() => setActiveTab('saved')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'saved' ? '2px solid var(--accent-green)' : '2px solid transparent',
            color: activeTab === 'saved' ? 'var(--accent-green)' : 'var(--text-sub)',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Saved Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'search' ? '2px solid var(--accent-green)' : '2px solid transparent',
            color: activeTab === 'search' ? 'var(--accent-green)' : 'var(--text-sub)',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🔍 Discover Users
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'saved' ? (
          <ContactList
            contacts={contacts}
            onMessage={handleMessage}
            onDelete={handleDelete}
          />
        ) : (
          <SearchUser
            onMessage={handleMessage}
            onAddContact={handleAddFromSearch}
          />
        )}
      </div>
    </div>
  );
};
