// Messages API endpoints
import { api } from './api';

export const messageApi = {
  getMessages: (conversationId, limit = 50, offset = 0) =>
    api.get(`/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`),
  sendMessageRest: (conversationId, content) =>
    api.post(`/conversations/${conversationId}/messages`, { content }),
  markAsRead: (conversationId) =>
    api.post(`/conversations/${conversationId}/messages/read`, {}),
};
