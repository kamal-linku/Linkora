// High-level Chat WebSocket actions and handlers
import { wsService } from './websocket';

export const chatSocket = {
  sendMessage: (conversationId, content, tempId) => {
    return wsService.send({
      type: 'send_message',
      conversation_id: conversationId,
      content,
      temp_id: tempId,
    });
  },

  sendTyping: (conversationId, isTyping) => {
    return wsService.send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  },

  sendReadReceipt: (conversationId) => {
    return wsService.send({
      type: 'message_read',
      conversation_id: conversationId,
    });
  },

  onNewMessage: (callback) => wsService.on('new_message', callback),
  onMessageSent: (callback) => wsService.on('message_sent', callback),
  onTyping: (callback) => wsService.on('typing', callback),
  onUserStatus: (callback) => wsService.on('user_status', callback),
  onMessagesRead: (callback) => wsService.on('messages_read', callback),
  onConnectionStatus: (callback) => wsService.on('connection_status', callback),
};
