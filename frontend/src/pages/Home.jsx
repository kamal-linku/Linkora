import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Modal } from '../components/common/Modal';
import { SearchUser } from '../components/contacts/SearchUser';
import { useChat } from '../hooks/useChat';
import { conversationApi } from '../services/conversationApi';
import { contactApi } from '../services/contactApi';

export const Home = () => {
  const { conversations, selectConversation, fetchConversations } = useChat();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (conv) => {
    selectConversation(conv);
    navigate(`/chat/${conv.id}`);
  };

  const handleStartChatWithUser = async (targetUserId) => {
    try {
      const conv = await conversationApi.createOrGetDirect(targetUserId);
      await fetchConversations();
      setShowSearchModal(false);
      selectConversation(conv);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      alert(err.message || 'Could not start conversation');
    }
  };

  const handleAddContact = async (userId, userName) => {
    const savedName = prompt('Enter a nickname for this contact:', userName || '');
    if (!savedName) return;

    try {
      await contactApi.addContact(userId, savedName.trim());
      alert('Contact added to phonebook!');
      fetchConversations();
    } catch (err) {
      alert(err.message || 'Failed to save contact');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Navbar
        title="ChatConnect"
        rightAction={
          <button
            onClick={() => setShowSearchModal(true)}
            className="btn-icon"
            title="Search Users"
          >
            🔍
          </button>
        }
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Sidebar
          conversations={conversations}
          onSelectConversation={handleSelect}
          onNewChat={() => setShowSearchModal(true)}
        />
      </div>

      {/* Floating Action Button (FAB) for New Chat */}
      <button
        onClick={() => setShowSearchModal(true)}
        className="btn btn-primary"
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          padding: 0,
          fontSize: '22px',
          boxShadow: '0 6px 18px rgba(37, 211, 102, 0.4)',
        }}
        title="New Chat"
      >
        💬
      </button>

      {/* User Search & Discovery Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Discover & Chat"
      >
        <div style={{ height: '380px' }}>
          <SearchUser
            onMessage={handleStartChatWithUser}
            onAddContact={handleAddContact}
          />
        </div>
      </Modal>
    </div>
  );
};
