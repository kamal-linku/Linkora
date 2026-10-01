import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { conversationApi } from '../services/conversationApi';
import { messageApi } from '../services/messageApi';
import { chatSocket } from '../websocket/chatSocket';

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTypingMap, setIsTypingMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const activeConvRef = useRef(activeConversation);
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Audio chime helper
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio playback denied before user interaction
    }
  };

  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await conversationApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const unConn = chatSocket.onConnectionStatus(({ isConnected }) => {
      setIsConnected(isConnected);
    });

    const unMsg = chatSocket.onNewMessage((data) => {
      const newMsg = data.message;
      playChime();

      if (activeConvRef.current && activeConvRef.current.id === newMsg.conversation_id) {
        setMessages((prev) => [...prev, newMsg]);
        chatSocket.sendReadReceipt(newMsg.conversation_id);
      }

      fetchConversations();
    });

    const unAck = chatSocket.onMessageSent((data) => {
      const { temp_id, message } = data;
      setMessages((prev) =>
        prev.map((m) => (m.id === temp_id ? message : m))
      );
      fetchConversations();
    });

    const unTyping = chatSocket.onTyping((data) => {
      const { conversation_id, user_id, is_typing } = data;
      setIsTypingMap((prev) => ({
        ...prev,
        [conversation_id]: is_typing ? user_id : null,
      }));
    });

    const unRead = chatSocket.onMessagesRead((data) => {
      const { conversation_id, read_ids } = data;
      if (activeConvRef.current && activeConvRef.current.id === conversation_id) {
        setMessages((prev) =>
          prev.map((m) => (read_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
        );
      }
    });

    const unStatus = chatSocket.onUserStatus((data) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.other_user && c.other_user.id === data.user_id) {
            return {
              ...c,
              other_user: {
                ...c.other_user,
                is_online: data.is_online,
                last_seen: data.last_seen,
              },
            };
          }
          return c;
        })
      );
    });

    return () => {
      unConn();
      unMsg();
      unAck();
      unTyping();
      unRead();
      unStatus();
    };
  }, [isAuthenticated]);

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    setLoadingMessages(true);
    try {
      const msgList = await messageApi.getMessages(conv.id, 100);
      setMessages(msgList);
      chatSocket.sendReadReceipt(conv.id);
      // update unread in conversation list
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = (content) => {
    if (!activeConversation || !content.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      conversation_id: activeConversation.id,
      sender_id: user.id,
      message_type: 'text',
      content: content.trim(),
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send over WebSocket
    const sent = chatSocket.sendMessage(activeConversation.id, content.trim(), tempId);
    if (!sent) {
      // Fallback to REST API
      messageApi.sendMessageRest(activeConversation.id, content.trim()).then((saved) => {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        fetchConversations();
      });
    }

    // Clear typing
    chatSocket.sendTyping(activeConversation.id, false);
  };

  const sendTyping = (isTyping) => {
    if (activeConversation) {
      chatSocket.sendTyping(activeConversation.id, isTyping);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingMessages,
        isTypingMap,
        isConnected,
        selectConversation,
        sendMessage,
        sendTyping,
        fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
