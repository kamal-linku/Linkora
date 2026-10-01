import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useChat } from '../hooks/useChat';
import { conversationApi } from '../services/conversationApi';
import { contactApi } from '../services/contactApi';

export const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeConversation, selectConversation, conversations } = useChat();

  useEffect(() => {
    const convId = parseInt(id, 10);
    if (!activeConversation || activeConversation.id !== convId) {
      const found = conversations.find((c) => c.id === convId);
      if (found) {
        selectConversation(found);
      } else {
        // Fetch from API
        conversationApi.getConversationDetail(convId).then((data) => {
          selectConversation(data);
        }).catch(() => {
          navigate('/');
        });
      }
    }
  }, [id, conversations]);

  const handleSaveContact = async () => {
    if (!activeConversation?.other_user) return;
    const name = prompt('Enter a nickname for this contact:', activeConversation.other_user.name || '');
    if (!name) return;

    try {
      await contactApi.addContact(activeConversation.other_user.id, name.trim());
      alert('Contact saved!');
    } catch (err) {
      alert(err.message || 'Failed to save contact');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ChatWindow
        onBack={() => navigate('/')}
        onSaveContact={handleSaveContact}
      />
    </div>
  );
};
